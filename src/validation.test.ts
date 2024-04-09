import { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { mockDeep } from 'jest-mock-extended';
import Joi from 'joi';

import { ApplicationError } from './error';
import { MiddlewareResult } from './middleware';
import { requestValidation, responseValidation } from './validation';

describe('The requestValidation should', () => {
    const exampleSchema = Joi.object({ example: Joi.string().required() });
    const contextMock = mockDeep<InvocationContext>();
    const requestMock = mockDeep<HttpRequest>();
    const initialMiddlewareResult: MiddlewareResult<ReturnType<HttpHandler>> = { $failed: false, $result: undefined };

    test('successfully validate the passed object', async () => {
        requestMock.clone.mockReturnValue(requestMock);
        requestMock.json.mockResolvedValue({ example: 'test-body' });

        const result = await requestValidation(exampleSchema)(requestMock, contextMock, initialMiddlewareResult);

        expect(result).toBeUndefined();
    });

    test('successfully validate the object extracted through the passed function', async () => {
        const result = await requestValidation(exampleSchema, {
            extractValidationContentFromRequest: () => ({
                example: 'test-extracted-content',
            }),
        })(requestMock, contextMock, initialMiddlewareResult);

        expect(result).toBeUndefined();
    });

    test('fail when the validation was not successful', async () => {
        requestMock.json.mockResolvedValue('test-body');

        await expect(
            requestValidation(exampleSchema)(requestMock, contextMock, initialMiddlewareResult),
        ).rejects.toThrowError(new ApplicationError('Validation Error', 400));
    });

    test('do not throw an error, even when the validation was not successful, if throwing is disabled', async () => {
        requestMock.json.mockResolvedValue({ example: 'test-body' });

        await expect(
            requestValidation(exampleSchema, { shouldThrowOnValidationError: false })(
                requestMock,
                contextMock,
                initialMiddlewareResult,
            ),
        ).resolves.toEqual(undefined);
    });

    test('fail when the validation was not successful with transformed error message', async () => {
        requestMock.json.mockResolvedValue({ example: { fail: 'test-body' } });

        await expect(
            requestValidation(exampleSchema, {
                transformErrorMessage: (message) => ({
                    type: 'Validation Error',
                    message,
                }),
            })(requestMock, contextMock, initialMiddlewareResult),
        ).rejects.toThrowError(new ApplicationError('Validation Error', 400));
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
    const contextMock = mockDeep<InvocationContext>();
    const requestMock = mockDeep<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('do nothing, if the response is valid', async () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { example: 'test-body' } };

        const result = await responseValidation(exampleSchema)(requestMock, contextMock, initialMiddlewareResult);

        expect(result).toBeUndefined();
    });

    test('do nothing, if the object, extracted through the passed function, is valid', async () => {
        initialMiddlewareResult.$result = { jsonBody: { example: 'test-body' } };
        const extractValidationContentFromRequest = () => ({
            status: 201,
            jsonBody: { example: 'not-test-body' },
        });

        const result = await responseValidation(exampleSchema, {
            extractValidationContentFromRequest,
        })(requestMock, contextMock, initialMiddlewareResult);

        expect(result).toBeUndefined();
    });

    test('throw, if the response is invalid', async () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { fail: 'this-fails' } };

        await expect(
            responseValidation(exampleSchema)(requestMock, contextMock, initialMiddlewareResult),
        ).rejects.toThrowError(new ApplicationError('Internal server error', 500));
    });

    test('do not throw an error, even when the validation was not successful, if throwing is disabled', async () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { fail: 'this-fails' } };

        await expect(
            responseValidation(exampleSchema, { shouldThrowOnValidationError: false })(
                requestMock,
                contextMock,
                initialMiddlewareResult,
            ),
        ).resolves.toEqual(undefined);
    });

    test('fail when the validation was not successful with transformed error message', async () => {
        initialMiddlewareResult.$result = { status: 201, jsonBody: { fail: 'this-fails' } };

        await expect(
            responseValidation(exampleSchema, {
                transformErrorMessage: (message: string) => ({
                    type: 'Validation Error',
                    message,
                }),
            })(requestMock, contextMock, initialMiddlewareResult),
        ).rejects.toThrowError(new ApplicationError('Internal server error', 500));
    });
});
