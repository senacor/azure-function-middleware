import { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import Joi from 'joi';

import { ApplicationError } from '../error';
import { MiddlewareResult } from '../middleware';
import { requestValidation } from './requestValidation';

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

    // test for Joi validation options
    test.only('successfully validate with Joi validation options', async () => {
        const schemaWithOptions = exampleSchema.options({ allowUnknown: true });
        const result = await requestValidation(schemaWithOptions)(
            createRequest({ example: 'test-body', extraField: 'allowed' }),
            new InvocationContext(),
            initialMiddlewareResult,
        );
        expect(result).toBeUndefined();
    });
});
