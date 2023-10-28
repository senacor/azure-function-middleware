import { Context, HttpRequest } from '@azure/functions';
import { mockDeep } from 'jest-mock-extended';
import Joi from 'joi';

import { ApplicationError } from './error';
import { requestValidation, responseValidation } from './validation';

describe('The requestValidation should', () => {
    const exampleSchema = Joi.object({ example: Joi.string().required() });
    const contextMock = mockDeep<Context>();
    const requestMock = mockDeep<HttpRequest>();

    beforeEach(() => {
        contextMock.log.verbose = jest.fn();
        jest.restoreAllMocks();
    });

    test('successfully validate the passed object', async () => {
        requestMock.method = 'POST';
        requestMock.body = { example: 'test-body' };

        const result = await requestValidation(exampleSchema)(contextMock, requestMock);

        expect(result).toBeUndefined();
    });

    test('successfully validate the object extracted through the passed function', async () => {
        requestMock.method = 'GET';

        const result = await requestValidation(exampleSchema, {
            extractValidationContentFromRequest: () => ({
                example: 'test-extracted-content',
            }),
        })(contextMock, requestMock);

        expect(result).toBeUndefined();
    });

    test('fail when the validation was not successful', async () => {
        requestMock.method = 'POST';
        requestMock.body = 'test-body';

        await expect(requestValidation(exampleSchema)(contextMock, requestMock)).rejects.toThrowError(
            new ApplicationError('Validation Error', 400),
        );
    });

    test('do not throw an error, even when the validation was not successful, if throwing is disabled', async () => {
        requestMock.method = 'POST';
        requestMock.body = 'test-body';

        requestMock.method = 'POST';
        requestMock.body = 'test-body';

        await expect(
            requestValidation(exampleSchema, { shouldThrowOnValidationError: false })(contextMock, requestMock),
        ).resolves.toEqual(undefined);
    });

    test('fail when the validation was not successful with transformed error message', async () => {
        requestMock.method = 'POST';
        requestMock.body = { fail: 'test-body' };

        await expect(
            requestValidation(exampleSchema, {
                transformErrorMessage: (message) => ({
                    type: 'Validation Error',
                    message,
                }),
            })(contextMock, requestMock),
        ).rejects.toThrowError(new ApplicationError('Validation Error', 400));
    });
});

describe('The responseValidation should', () => {
    const exampleSchema = Joi.object({
        status: Joi.number().required(),
        body: Joi.object({
            example: Joi.string().required(),
        }),
    });
    const contextMock = mockDeep<Context>();
    const requestMock = mockDeep<HttpRequest>();

    beforeEach(() => {
        contextMock.log.verbose = jest.fn();
        jest.restoreAllMocks();
    });

    test('do nothing, if the response is valid', async () => {
        contextMock.res = {};
        contextMock.res.status = 201;
        contextMock.res.body = { example: 'test-body' };

        const result = await responseValidation(exampleSchema)(contextMock, requestMock);

        expect(result).toBeUndefined();
    });

    test('do nothing, if the object, extracted through the passed function, is valid', async () => {
        contextMock.res = {};
        contextMock.res.body = { example: 'test-body' };

        const result = await responseValidation(exampleSchema, {
            extractValidationContentFromRequest: (context) => ({ status: 201, body: context?.res?.body }),
        })(contextMock, requestMock);

        expect(result).toBeUndefined();
    });

    test('throw, if the response is invalid', async () => {
        contextMock.res = {};
        contextMock.res.status = 201;
        contextMock.res.body = { fail: 'this fails' };

        await expect(responseValidation(exampleSchema)(contextMock, requestMock)).rejects.toThrowError(
            new ApplicationError('Internal server error', 500),
        );
    });

    test('do not throw an error, even when the validation was not successful, if throwing is disabled', async () => {
        contextMock.res = {};
        contextMock.res.status = 201;
        contextMock.res.body = { fail: 'this fails' };

        await expect(
            responseValidation(exampleSchema, { shouldThrowOnValidationError: false })(contextMock, requestMock),
        ).resolves.toEqual(undefined);
    });

    test('fail when the validation was not successful with transformed error message', async () => {
        contextMock.res = {};
        contextMock.res.status = 201;
        contextMock.res.body = { fail: 'this fails' };

        await expect(
            responseValidation(exampleSchema, {
                transformErrorMessage: (message) => ({
                    type: 'Validation Error',
                    message,
                }),
            })(contextMock, requestMock),
        ).rejects.toThrowError(new ApplicationError('Internal server error', 500));
    });
});
