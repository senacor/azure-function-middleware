import { HttpRequest, InvocationContext } from '@azure/functions';
import Joi from 'joi';

import { ApplicationError } from '../error';
import { requestBodyValidation } from './requestBodyValidation';

describe('requestBodyValidation should', () => {
    const context = new InvocationContext();
    const exampleSchema = Joi.object({ name: Joi.string().required() });

    test('accept valid request body', async () => {
        const validator = requestBodyValidation(exampleSchema);

        await expect(
            validator(createRequest(), context, { $failed: false, $result: undefined }),
        ).resolves.toBeUndefined();
    });

    test('throw error if the request body does not match the given schema', async () => {
        const validator = requestBodyValidation(exampleSchema);

        try {
            await validator(createRequest({ id: 42 }), context, { $failed: false, $result: undefined });
        } catch (err) {
            if (err instanceof ApplicationError) {
                expect(err.message).toEqual('Request body validation error');
                expect(err.status).toEqual(400);
                expect(err.body).toEqual({
                    message: '"name" is required',
                });
            }
        }

        expect.assertions(3);
    });

    test('throw error if the request body does not match the given schema and transform error message correctly', async () => {
        const validator = requestBodyValidation(exampleSchema, {
            transformErrorMessage: () => `Custom error message`,
        });

        try {
            await validator(createRequest({ id: 42 }), context, { $failed: false, $result: undefined });
        } catch (err) {
            if (err instanceof ApplicationError) {
                expect(err.message).toEqual('Request body validation error');
                expect(err.status).toEqual(400);
                expect(err.body).toEqual('Custom error message');
            }
        }

        expect.assertions(3);
    });

    test('throw no error if the request body does not match the given schema and shouldThrowOnValidationError = false', async () => {
        const validator = requestBodyValidation(exampleSchema, { shouldThrowOnValidationError: false });

        await expect(
            validator(createRequest({ id: 42 }), context, { $failed: false, $result: undefined }),
        ).resolves.toBeUndefined();
    });
});

function createRequest(jsonBody: unknown = { name: 'John Doe' }) {
    return new HttpRequest({
        url: 'http://localhost:8080',
        method: 'POST',
        body: { string: JSON.stringify(jsonBody) },
    });
}
