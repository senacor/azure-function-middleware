import { HttpHandler, HttpRequest } from '@azure/functions';
import { AnySchema, ValidationOptions } from 'joi';

import { ApplicationError } from '../error';
import { BeforeExecutionFunction, isErrorResult } from '../middleware';

export type RequestQueryParamsValidationOptions = {
    shouldThrowOnValidationError?: boolean;
    transformErrorMessage?: (message: string) => unknown;
    printInputOnValidationError?: boolean;
    joiValidationOptions?: ValidationOptions;
    queryParamsToExcludeFromValidation?: string[];
};

export function requestQueryParamsValidation(
    schema: AnySchema,
    options?: RequestQueryParamsValidationOptions,
): BeforeExecutionFunction<HttpHandler> {
    const shouldThrowOnValidationError = options?.shouldThrowOnValidationError ?? true;
    const transformErrorMessage = options?.transformErrorMessage ?? ((message: string) => ({ message }));
    const printInputOnValidationError = options?.printInputOnValidationError ?? true;
    const queryParamsToExcludeFromValidation = options?.queryParamsToExcludeFromValidation ?? ['code']; // function key can be sent via code param

    return async (req, context, result) => {
        if (isErrorResult<ReturnType<HttpHandler>>(result)) {
            context.info(`Skipping request query params validation because the result is faulty`);
            return;
        }

        const validationResult = schema.validate(
            getQueryParams(req, queryParamsToExcludeFromValidation),
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

function getQueryParams(req: HttpRequest, queryParamsToExcludeFromValidation: string[]) {
    const queryParams = { ...Object.fromEntries(req.query) };

    queryParamsToExcludeFromValidation.forEach((key) => {
        delete queryParams[key];
    });

    return queryParams;
}
