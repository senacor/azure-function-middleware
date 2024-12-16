import { HttpHandler } from '@azure/functions';
import { AnySchema } from 'joi';

import { ApplicationError } from '../error';
import { BeforeExecutionFunction, isErrorResult } from '../middleware';

export type RequestQueryParamsValidationOptions = {
    shouldThrowOnValidationError?: boolean;
    transformErrorMessage?: (message: string) => unknown;
    printInputOnValidationError?: boolean;
};

export function requestQueryParamsValidation(
    schema: AnySchema,
    options?: RequestQueryParamsValidationOptions,
): BeforeExecutionFunction<HttpHandler> {
    const shouldThrowOnValidationError = options?.shouldThrowOnValidationError ?? true;
    const transformErrorMessage = options?.transformErrorMessage ?? ((message: string) => ({ message }));
    const printInputOnValidationError = options?.printInputOnValidationError ?? true;

    return async (req, context, result) => {
        if (isErrorResult<ReturnType<HttpHandler>>(result)) {
            context.info(`Skipping request query params validation because the result is faulty`);
            return;
        }

        const validationResult = schema.validate(Object.fromEntries(req.query));

        if (validationResult.error) {
            context.error(
                'Request query params did not match the given schema:',
                JSON.stringify(validationResult.error),
            );

            if (printInputOnValidationError) {
                context.info('Invalid request query params:', JSON.stringify(req.query));
            }

            if (shouldThrowOnValidationError) {
                throw new ApplicationError(
                    'Request query params validation error',
                    400,
                    transformErrorMessage(validationResult.error.message),
                );
            }
        } else {
            context.info('Request query params are valid');
        }
    };
}
