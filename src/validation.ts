import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { AnySchema } from 'joi';

import { ApplicationError } from './error';

type ValidationOptions = Partial<{
    transformErrorMessage: (message: string) => unknown;
    extractValidationContentFromRequest: (context: Context, req: HttpRequest) => unknown;
    shouldThrowOnValidationError: boolean;
}>;

export function requestValidation(schema: AnySchema, opts?: ValidationOptions): AzureFunction {
    return (context: Context, req: HttpRequest): Promise<void> => {
        context.log.verbose('Validating the request.');

        const toBeValidatedContent = opts?.extractValidationContentFromRequest?.(context, req) ?? req.body;
        const shouldThrowOnValidationError = opts?.shouldThrowOnValidationError ?? true;

        const validationResult = schema.validate(toBeValidatedContent);
        if (validationResult && validationResult.error) {
            context.log.error('The request did not match the given schema.');
            context.log.verbose(validationResult);

            if (shouldThrowOnValidationError) {
                return Promise.reject(
                    new ApplicationError(
                        'Validation Error',
                        400,
                        opts?.transformErrorMessage
                            ? opts?.transformErrorMessage(validationResult.error.message)
                            : {
                                  message: validationResult.error.message,
                              },
                    ),
                );
            }
        }

        context.log.verbose('Finished validating the request.');
        return Promise.resolve();
    };
}

export function responseValidation(schema: AnySchema, opts?: ValidationOptions): AzureFunction {
    return (context: Context, req: HttpRequest): Promise<void> => {
        context.log.verbose('Validating the server-response.');

        const toBeValidatedContent = opts?.extractValidationContentFromRequest?.(context, req) ?? context.res;
        const shouldThrowOnValidationError = opts?.shouldThrowOnValidationError ?? true;

        const validationResult = schema.validate(toBeValidatedContent);
        if (validationResult && validationResult.error) {
            context.log.error('The response did not match the given schema.');
            context.log.verbose(validationResult);

            if (shouldThrowOnValidationError) {
                return Promise.reject(
                    new ApplicationError(
                        'Internal server error',
                        500,
                        opts?.transformErrorMessage
                            ? opts?.transformErrorMessage(validationResult.error.message)
                            : {
                                  message: validationResult.error.message,
                              },
                    ),
                );
            }
        }

        context.log.verbose('Finished validating the response.');
        return Promise.resolve();
    };
}
