import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { HttpRequestHeaders } from '@azure/functions/types/http';

import { ApplicationError } from './error';

export default (
    validateUsingHeaderFn?: (headers: HttpRequestHeaders) => boolean,
    errorResponseBody?: unknown,
): AzureFunction => {
    return (context: Context, req: HttpRequest): Promise<void> => {
        if (validateUsingHeaderFn) {
            const validationResult = validateUsingHeaderFn(req.headers);
            if (validationResult) {
                return Promise.resolve();
            } else {
                return Promise.reject(
                    new ApplicationError(
                        'Authentication error',
                        403,
                        errorResponseBody ?? 'No sophisticated credentials provided',
                    ),
                );
            }
        } else {
            const authenticationHeader = req.headers['x-ms-client-principal-id'];
            if (!!authenticationHeader) {
                return Promise.resolve();
            } else {
                return Promise.reject(
                    new ApplicationError(
                        'Authentication error',
                        403,
                        errorResponseBody ?? 'No sophisticated credentials provided',
                    ),
                );
            }
        }
    };
};
