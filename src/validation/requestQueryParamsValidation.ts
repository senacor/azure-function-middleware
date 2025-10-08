import { HttpHandler, HttpRequest } from '@azure/functions';
import { AnySchema, ValidationOptions } from 'joi';

import { ApplicationError } from '../error';
import { BeforeExecutionFunction, isErrorResult } from '../middleware';

export type RequestQueryParamsValidationOptions = {
    shouldThrowOnValidationError?: boolean;
    transformErrorMessage?: (message: string) => unknown;
    printInputOnValidationError?: boolean;
    joiValidationOptions?: ValidationOptions;
    excludeCodeFromValidation?: boolean; // function key can be sent via code param
};

export function requestQueryParamsValidation(
    schema: AnySchema,
    options?: RequestQueryParamsValidationOptions,
): BeforeExecutionFunction<HttpHandler> {
    const shouldThrowOnValidationError = options?.shouldThrowOnValidationError ?? true;
    const transformErrorMessage = options?.transformErrorMessage ?? ((message: string) => ({ message }));
    const printInputOnValidationError = options?.printInputOnValidationError ?? true;
    const excludeCodeFromValidation = options?.excludeCodeFromValidation ?? true;

    return async (req, context, result) => {
        if (isErrorResult<ReturnType<HttpHandler>>(result)) {
            context.info(`Skipping request query params validation because the result is faulty`);
            return;
        }

        const validationResult = schema.validate(
            getQueryParams(req, excludeCodeFromValidation),
            options?.joiValidationOptions,
        );

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

function getQueryParams(req: HttpRequest, excludeCodeFromValidation: boolean) {
    if (excludeCodeFromValidation) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { code, ...queryParamsWithoutCode } = Object.fromEntries(req.query);
        return queryParamsWithoutCode;
    }

    return Object.fromEntries(req.query);
}
