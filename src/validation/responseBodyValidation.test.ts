import { HttpRequest, InvocationContext } from '@azure/functions';
import Joi from 'joi';

import { responseBodyValidation } from './responseBodyValidation';

describe('responseBodyValidation should', () => {
    const context = new InvocationContext();
    const responseSchemas = {
        200: Joi.object({ name: Joi.string().required() }),
        404: Joi.object({ details: Joi.string().required() }),
    };

    test('accept valid response body for status 200', async () => {
        const validator = responseBodyValidation(responseSchemas, { shouldThrowOnValidationError: true });

        await expect(
            validator(createRequest(), context, {
                $failed: false,
                $result: { status: 200, jsonBody: { name: 'John Doe' } },
            }),
        ).resolves.toBeUndefined();
    });

    test('accept valid response body for status 404', async () => {
        const validator = responseBodyValidation(responseSchemas, { shouldThrowOnValidationError: true });

        await expect(
            validator(createRequest(), context, {
                $failed: false,
                $result: { status: 404, jsonBody: { details: 'Not found' } },
            }),
        ).resolves.toBeUndefined();
    });

    test('validate response body with joi validation options', async () => {
        const validator = responseBodyValidation(responseSchemas, {
            shouldThrowOnValidationError: true,
            joiValidationOptions: { allowUnknown: true },
        });

        await expect(
            validator(createRequest(), context, {
                $failed: false,
                $result: { status: 200, jsonBody: { name: 'John Doe', unknownValue: 'yes' } },
            }),
        ).resolves.toBeUndefined();
    });

    test('throw error if the response body does not match the given schema and shouldThrowOnValidationError = true', async () => {
        const validator = responseBodyValidation(responseSchemas, { shouldThrowOnValidationError: true });

        await expect(
            validator(createRequest(), context, {
                $failed: false,
                $result: { status: 200, jsonBody: { id: 42 } },
            }),
        ).rejects.toMatchObject({ message: 'Response body validation error', status: 500 });
    });

    test('throw error if there is no schema for the response status and shouldThrowOnValidationError = true', async () => {
        const validator = responseBodyValidation(responseSchemas, { shouldThrowOnValidationError: true });

        await expect(
            validator(createRequest(), context, {
                $failed: false,
                $result: { status: 201, jsonBody: {} },
            }),
        ).rejects.toMatchObject({
            message: 'Response body validation error as there is no schema for status 201',
            status: 500,
        });
    });

    test('throw no error if the response body does not match the given schema and shouldThrowOnValidationError = false', async () => {
        const validator = responseBodyValidation(responseSchemas, { shouldThrowOnValidationError: false });

        await expect(
            validator(createRequest(), context, {
                $failed: false,
                $result: { status: 200, jsonBody: { id: 42 } },
            }),
        ).resolves.toBeUndefined();
    });
});

function createRequest() {
    return new HttpRequest({
        url: 'http://localhost:8080',
        method: 'POST',
    });
}
