import { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { mockDeep } from 'jest-mock-extended';
import Joi from 'joi';

import { ApplicationError } from './error';
import { MiddlewareResult } from './middleware';
import { requestValidation, responseValidation } from './validation';

describe('The requestValidation should', () => {
    const exampleSchema = Joi.object({ example: Joi.string().required() });
    const initialMiddlewareResult: MiddlewareResult<ReturnType<HttpHandler>> = { $failed: false, $result: undefined };
    const createRequest = (jsonBody: unknown = { example: 'test-body' }) =>
        new HttpRequest({
            url: 'http://localhost:8080',
            method: 'POST',
            body: { string: JSON.stringify(jsonBody) },
        });

    test('successfully validate the passed object', async () => {
        const result = await requestValidation(exampleSchema)(
            createRequest(),
            new InvocationContext(),
            initialMiddlewareResult,
        );

        expect(result).toBeUndefined();
    });

    test('successfully validate the object extracted through the passed function', async () => {
        const result = await requestValidation(exampleSchema, {
            extractValidationContentFromRequest: () => ({
                example: 'test-extracted-content',
            }),
        })(createRequest(), new InvocationContext(), initialMiddlewareResult);

        expect(result).toBeUndefined();
    });

    test('fail when the validation was not successful', async () => {
        await expect(
            requestValidation(exampleSchema)(
                createRequest({ not: 'valid' }),
                new InvocationContext(),
                initialMiddlewareResult,
            ),
        ).rejects.toThrowError(new ApplicationError('Validation Error', 400));
    });

    test('do not throw an error, even when the validation was not successful, if throwing is disabled', async () => {
        const result = await requestValidation(exampleSchema, { shouldThrowOnValidationError: false })(
            createRequest({ example: 'test-body' }),
            new InvocationContext(),
            initialMiddlewareResult,
        );

        expect(result).toBeUndefined();
    });

    test('fail when the validation was not successful with transformed error message', async () => {
        await expect(
            requestValidation(exampleSchema, {
                transformErrorMessage: (message) => ({
                    type: 'Validation Error',
                    message,
                }),
            })(createRequest({ example: { fail: 'test-body' } }), new InvocationContext(), initialMiddlewareResult),
        ).rejects.toThrow(new ApplicationError('Validation Error', 400));
    });
});

describe('The responseValidation should', () => {
    const initialMiddlewareResult: MiddlewareResult<ReturnType<HttpHandler>> = { $failed: false, $result: undefined };

    const exampleSchema = Joi.object({
        status: Joi.number().required(),
        jsonBody: Joi.object({
            example: Joi.string().required(),
        }),
    });
    const requestMock = mockDeep<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('do nothing, if the response is valid', () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { example: 'test-body' } };

        const result = responseValidation(exampleSchema)(requestMock, new InvocationContext(), initialMiddlewareResult);

        expect(result).toBeUndefined();
    });

    test('do nothing, if the object, extracted through the passed function, is valid', () => {
        initialMiddlewareResult.$result = { jsonBody: { example: 'test-body' } };
        const extractValidationContentFromRequest = () => ({
            status: 201,
            jsonBody: { example: 'not-test-body' },
        });

        const result = responseValidation(exampleSchema, {
            extractValidationContentFromRequest,
        })(requestMock, new InvocationContext(), initialMiddlewareResult);

        expect(result).toBeUndefined();
    });

    test('throw, if the response is invalid', () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { fail: 'this-fails' } };

        expect(() =>
            responseValidation(exampleSchema)(requestMock, new InvocationContext(), initialMiddlewareResult),
        ).toThrow(new ApplicationError('Internal server error', 500));
    });

    test('do not throw an error, even when the validation was not successful, if throwing is disabled', () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { fail: 'this-fails' } };

        const res = responseValidation(exampleSchema, { shouldThrowOnValidationError: false })(
            requestMock,
            new InvocationContext(),
            initialMiddlewareResult,
        );
        expect(res).toEqual(undefined);
    });

    test('fail when the validation was not successful with transformed error message', () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { fail: 'this-fails' } };

        expect(() =>
            responseValidation(exampleSchema, {
                transformErrorMessage: (message: string) => ({
                    type: 'Validation Error',
                    message,
                }),
            })(requestMock, new InvocationContext(), initialMiddlewareResult),
        ).toThrow(new ApplicationError('Internal server error', 500));
    });
});
