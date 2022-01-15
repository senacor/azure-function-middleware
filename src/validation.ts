import { Context, HttpRequest } from '@azure/functions';
import { ObjectSchema } from 'joi';
import { ApplicationError } from './applicationError';
import { MiddlewareFunction } from './middleware';

export default (
    schema: ObjectSchema,
    transformErrorMessage?: (message: string) => unknown,
    extractValidationContentFromRequest?: (context: Context, req: HttpRequest) => unknown,
): MiddlewareFunction => {
    return (context: Context, req: HttpRequest): Promise<void> => {
        const toBeValidatedContent = extractValidationContentFromRequest
            ? extractValidationContentFromRequest(context, req)
            : req.body;
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
