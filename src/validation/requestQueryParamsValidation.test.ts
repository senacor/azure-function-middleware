import { HttpRequest, InvocationContext } from '@azure/functions';
import Joi from 'joi';

import { ApplicationError } from '../error';
import { requestQueryParamsValidation } from './requestQueryParamsValidation';

describe('requestQueryParamsValidation should', () => {
    const context = new InvocationContext();
    const exampleSchema = Joi.object({ status: Joi.string().valid('active', 'expired').optional() });

    test.each([{ status: 'active' }, {}, undefined] as Record<string, string>[])(
        'accept valid query params %s',
        async (queryParams?: Record<string, string>) => {
            const validator = requestQueryParamsValidation(exampleSchema);

            await expect(
                validator(createRequest(queryParams), context, { $failed: false, $result: undefined }),
            ).resolves.toBeUndefined();
        },
    );

    test('throw error if the query params do not match the given schema', async () => {
        const validator = requestQueryParamsValidation(exampleSchema);

        try {
            await validator(createRequest({ status: 'invalid' }), context, { $failed: false, $result: undefined });
        } catch (err) {
            if (err instanceof ApplicationError) {
                expect(err.message).toEqual('Request query params validation error');
                expect(err.status).toEqual(400);
                expect(err.body).toEqual({
                    message: '"status" must be one of [active, expired]',
                });
            }
        }

        expect.assertions(3);
    });

    test('throw error if the query params do not match the given schema and transform error message correctly', async () => {
        const validator = requestQueryParamsValidation(exampleSchema, {
            transformErrorMessage: () => `Custom error message`,
        });

        try {
            await validator(createRequest({ status: 'invalid' }), context, { $failed: false, $result: undefined });
        } catch (err) {
            if (err instanceof ApplicationError) {
                expect(err.message).toEqual('Request query params validation error');
                expect(err.status).toEqual(400);
                expect(err.body).toEqual('Custom error message');
            }
        }

        expect.assertions(3);
    });

    test('throw no error if the query params do not match the given schema and shouldThrowOnValidationError = false', async () => {
        const validator = requestQueryParamsValidation(exampleSchema, { shouldThrowOnValidationError: false });

        await expect(
            validator(createRequest({ status: 'invalid' }), context, { $failed: false, $result: undefined }),
        ).resolves.toBeUndefined();
    });
});

function createRequest(query?: Record<string, string>) {
    return new HttpRequest({
        url: 'http://localhost:8080',
        method: 'GET',
        query,
    });
}
