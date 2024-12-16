import { HttpHandler } from '@azure/functions';
import { AnySchema } from 'joi';

import { ApplicationError } from '../error';
import { PostExecutionFunction, isErrorResult } from '../middleware';
import { stringify } from '../util/stringify';
import { ValidationOptions } from './ValidationOptions';

export function responseValidation(schema: AnySchema, opts?: ValidationOptions): PostExecutionFunction<HttpHandler> {
    const printResponse = opts?.printInput ?? false;
    return (req, context, result) => {
        context.info('Validating the server-response.');

        const toBeValidatedContent =
            opts?.extractValidationContentFromRequest?.(req, context, result) ??
            (isErrorResult<ReturnType<HttpHandler>>(result) ? result.$error : result.$result);
        const shouldThrowOnValidationError = opts?.shouldThrowOnValidationError ?? true;

        const validationResult = schema.validate(toBeValidatedContent);
        if (validationResult && validationResult.error) {
            context.error(
                `The response did not match the given schema.${
                    printResponse ? JSON.stringify(toBeValidatedContent) : ''
                }: ${JSON.stringify(validationResult)}`,
            );

            if (shouldThrowOnValidationError) {
                throw new ApplicationError(
                    'Internal server error',
                    500,
                    opts?.transformErrorMessage
                        ? opts?.transformErrorMessage(validationResult.error.message)
                        : {
                              message: validationResult.error.message,
                          },
                );
            }
        }

        context.info('Finished validating the response.');
        return;
    };
}
