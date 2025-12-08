import { HttpRequest, InvocationContext } from '@azure/functions';
import Joi from 'joi';
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

    test('successfully validate request body with joi validation options', async () => {
        const validator = requestBodyValidation(exampleSchema, { joiValidationOptions: { allowUnknown: true } });

        await expect(
            validator(createRequest({ name: 'John Doe', unknownValue: 'yes' }), context, {
                $failed: false,
                $result: undefined,
            }),
        ).resolves.toBeUndefined();
    });

    test('throw error if the request body does not match the given schema', async () => {
        const validator = requestBodyValidation(exampleSchema);

        await expect(
            validator(createRequest({ id: 42 }), context, { $failed: false, $result: undefined }),
        ).rejects.toMatchObject({
            message: 'Request body validation error',
            status: 400,
            body: { message: '"name" is required' },
        });
    });

    test('throw error if the request body does not match the given schema and transform error message correctly', async () => {
        const validator = requestBodyValidation(exampleSchema, {
            transformErrorMessage: () => `Custom error message`,
        });

        await expect(
            validator(createRequest({ id: 42 }), context, { $failed: false, $result: undefined }),
        ).rejects.toMatchObject({
            message: 'Request body validation error',
            status: 400,
            body: 'Custom error message',
        });
    });

    test('throw error if request body contains invalid json', async () => {
        const validator = requestBodyValidation(exampleSchema);

        await expect(
            validator(
                new HttpRequest({
                    url: 'http://localhost:8080',
                    method: 'POST',
                    body: { string: 'invalid json' },
                }),
                context,
                { $failed: false, $result: undefined },
            ),
        ).rejects.toMatchObject({
            message: 'Request body contains invalid json',
            status: 400,
            body: { message: 'Request body contains invalid json' },
        });
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
