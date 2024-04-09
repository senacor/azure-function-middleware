import { HttpHandler } from '@azure/functions';
import { Headers } from 'undici';

import { ApplicationError } from './error';
import { BeforeExecutionFunction } from './middleware';

type ValidationFunction = (headers: Headers) => boolean;

const defaultHeaderValidation: ValidationFunction = (headers) => !!headers.get('x-ms-client-principal-id');
const defaultErrorResponseBody = 'No sophisticated credentials provided';

export type HeaderAuthenticationOptions = {
    validateUsingHeaderFn: ValidationFunction;
    errorResponseBody: unknown;
    skipIfResultIsFaulty: boolean;
};

export default (opts?: Partial<HeaderAuthenticationOptions>): BeforeExecutionFunction<HttpHandler> => {
    const validateUsingHeaderFn = opts?.validateUsingHeaderFn ?? defaultHeaderValidation;
    const errorResponseBody = opts?.errorResponseBody ?? defaultErrorResponseBody;
    const skipIfResultIsFaulty = opts?.skipIfResultIsFaulty ?? true;

    return (req, context, result): Promise<void> => {
        if (skipIfResultIsFaulty && result.$failed) {
            context.info('Skipping header-authentication because the result is faulty.');
            return Promise.resolve();
        }

        context.info('Executing header authentication.');
        const validationResult = validateUsingHeaderFn(req.headers);
        if (validationResult) {
            context.info('Header authentication was successful.');
            return Promise.resolve();
        } else {
            context.info('Header authentication was NOT successful.');
            return Promise.reject(
                new ApplicationError(
                    'Authentication error',
                    403,
                    errorResponseBody ?? 'No sophisticated credentials provided',
                ),
            );
        }
    };
};
