import { HttpHandler, HttpResponseInit } from '@azure/functions';
import { AnySchema } from 'joi';

import { ApplicationError } from '../error';
import { BeforeExecutionFunction, isErrorResult } from '../middleware';

export type ResponseBodyValidationOptions = {
    shouldThrowOnValidationError?: boolean;
    printInputOnValidationError?: boolean;
};

export function responseBodyValidation(
    schemas: Record<number, AnySchema>,
    options?: ResponseBodyValidationOptions,
): BeforeExecutionFunction<HttpHandler> {
    const shouldThrowOnValidationError = options?.shouldThrowOnValidationError ?? false;
    const printInputOnValidationError = options?.printInputOnValidationError ?? true;

    return async (req, context, result) => {
        if (isErrorResult<ReturnType<HttpHandler>>(result)) {
            context.info(`Skipping response body validation because the result is faulty`);
            return;
        }

        const httpResponse = result.$result as HttpResponseInit;
        const responseStatus = httpResponse.status;

        if (!responseStatus || !schemas[responseStatus]) {
            if (shouldThrowOnValidationError) {
                throw new ApplicationError(
                    `Response body validation error as there is no schema for status ${responseStatus}`,
                    500,
                );
            }

            return;
        }

        const validationResult = schemas[responseStatus].validate(httpResponse.jsonBody);

        if (validationResult.error) {
            context.error('Response body did not match the given schema:', JSON.stringify(validationResult.error));

            if (printInputOnValidationError) {
                context.info('Invalid response body:', JSON.stringify(httpResponse.jsonBody));
            }

            if (shouldThrowOnValidationError) {
                throw new ApplicationError('Response body validation error', 500);
            }
        } else {
            context.info('Response body is valid');
        }
    };
}
