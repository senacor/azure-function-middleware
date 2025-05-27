import { HttpHandler } from '@azure/functions';
import { AnySchema } from 'joi';

import { ApplicationError } from '../error';
import { BeforeExecutionFunction } from '../middleware';
import { ValidationOptions } from './ValidationOptions';

export function requestValidation(schema: AnySchema, opts?: ValidationOptions): BeforeExecutionFunction<HttpHandler> {
    const skipIfResultIsFaulty = opts?.skipIfResultIsFaulty ?? true;
    const printRequest = opts?.printInput ?? false;

    return async (req, context, result) => {
        if (skipIfResultIsFaulty && result.$failed) {
            context.info('Skipping request-validation because the result is faulty.');
            return;
        }

        const clonedRequest = req.clone(); //see https://github.com/nuxt/nuxt/issues/19245
        context.info('Validating the request.');
        try {
            const toBeValidatedContent =
                opts?.extractValidationContentFromRequest?.(clonedRequest, context, result) ??
                (await clonedRequest.json());
            const shouldThrowOnValidationError = opts?.shouldThrowOnValidationError ?? true;

            const validationResult = schema.validate(toBeValidatedContent, opts ?? {});
            if (validationResult && validationResult.error) {
                context.error(
                    `The request did not match the given schema.${
                        printRequest ? JSON.stringify(toBeValidatedContent) : ''
                    }: ${JSON.stringify(validationResult)}`,
                );

                if (shouldThrowOnValidationError) {
                    throw new ApplicationError(
                        'Validation Error',
                        400,
                        opts?.transformErrorMessage
                            ? opts?.transformErrorMessage(validationResult.error.message)
                            : {
                                  message: validationResult.error.message,
                              },
                    );
                }
            }

            context.info('Finished validating the request.');
            return;
        } catch (error) {
            if (error instanceof ApplicationError) {
                throw error;
            }

            if (error instanceof SyntaxError) {
                context.error(`The Json was probably ill-defined: ${error}`);
                //see https://fetch.spec.whatwg.org/#dom-body-json
                throw new ApplicationError('Validation Error', 400, {
                    message: error.message,
                });
            }

            context.error(`Unexpected server error occurred: `, error);
            throw new ApplicationError('Internal Server Error', 500, {
                message: 'An internal Server Error occurred while validating the request.',
            });
        }
    };
}
