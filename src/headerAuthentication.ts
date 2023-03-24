import { Context, HttpRequest } from '@azure/functions';
import { ApplicationError } from './applicationError';
import { MiddlewareFunction } from './middleware';
import { HttpRequestHeaders } from '@azure/functions/types/http';

export default (validateUsingHeaderFn?: (headers: HttpRequestHeaders) => boolean): MiddlewareFunction => {
    return (context: Context, req: HttpRequest): Promise<void> => {
        if (validateUsingHeaderFn) {
            const validationResult = validateUsingHeaderFn(req.headers);
            if (validationResult) {
                return Promise.resolve();
            } else {
                return Promise.reject(
                    new ApplicationError('Authentication error', 403, 'No sophisticated credentials provided'),
                );
            }
        } else {
            const authenticationHeader = req.headers['x-ms-client-principal'];
            if (!!authenticationHeader) {
                return Promise.resolve();
            } else {
                return Promise.reject(
                    new ApplicationError('Authentication error', 403, 'No sophisticated credentials provided'),
                );
            }
        }
    };
};
