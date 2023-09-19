import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { AnySchema } from 'joi';

import { ApplicationError } from './error';

export default (
    schema: AnySchema,
    transformErrorMessage?: (message: string) => unknown,
    extractValidationContentFromRequest?: (context: Context, req: HttpRequest) => unknown,
): AzureFunction => {
    return (context: Context, req: HttpRequest): Promise<void> => {
        const toBeValidatedContent = extractValidationContentFromRequest?.(context, req) ?? req.body;
        const validationResult = schema.validate(toBeValidatedContent);
        if (validationResult && validationResult.error) {
            context.log.verbose(validationResult);
            return Promise.reject(
                new ApplicationError(
                    'Validation Error',
                    400,
                    transformErrorMessage
                        ? transformErrorMessage(validationResult.error.message)
                        : {
                              message: validationResult.error.message,
                          },
                ),
            );
        }
        return Promise.resolve();
    };
};
