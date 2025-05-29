import { HttpHandler } from '@azure/functions';
import { AnySchema, ValidationOptions } from 'joi';

import { ApplicationError } from '../error';
import { BeforeExecutionFunction, isErrorResult } from '../middleware';

export type RequestBodyValidationOptions = {
    shouldThrowOnValidationError?: boolean;
    transformErrorMessage?: (message: string) => unknown;
    printInputOnValidationError?: boolean;
    joiValidationOptions?: ValidationOptions;
};

export function requestBodyValidation(
    schema: AnySchema,
    options?: RequestBodyValidationOptions,
): BeforeExecutionFunction<HttpHandler> {
    const shouldThrowOnValidationError = options?.shouldThrowOnValidationError ?? true;
    const transformErrorMessage = options?.transformErrorMessage ?? ((message: string) => ({ message }));
    const printInputOnValidationError = options?.printInputOnValidationError ?? true;

    return async (req, context, result) => {
        if (isErrorResult<ReturnType<HttpHandler>>(result)) {
            context.info('Skipping request body validation because the result is faulty');
            return;
        }

        const requestBody = await req
            .clone()
            .json()
            .catch((error) => {
                context.error('Error during request body validation:', error);
                throw new ApplicationError('Failed to get request body for validation', 500);
            });
        const validationResult = schema.validate(requestBody, options?.joiValidationOptions);

        if (validationResult.error) {
            context.error('Request body did not match the given schema:', JSON.stringify(validationResult.error));

            if (printInputOnValidationError) {
                context.info('Invalid request body:', JSON.stringify(requestBody));
            }

            if (shouldThrowOnValidationError) {
                throw new ApplicationError(
                    'Request body validation error',
                    400,
                    transformErrorMessage(validationResult.error.message),
                );
            }
        } else {
            context.info('Request body is valid');
        }
    };
}
