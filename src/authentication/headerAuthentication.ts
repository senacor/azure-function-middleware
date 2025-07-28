import { HttpHandler } from '@azure/functions';
import { Headers } from 'undici';

import { ApplicationError } from '../error';
import { BeforeExecutionFunction } from '../middleware';

export type ValidationFunction = (headers: Headers) => boolean | Promise<boolean>;

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

    return async (req, context, result) => {
        if (skipIfResultIsFaulty && result.$failed) {
            context.info('Skipping header-authentication because the result is faulty.');
            return;
        }

        context.info('Executing header authentication.');
        const validationResult = await validateUsingHeaderFn(req.headers);
        if (validationResult) {
            context.info('Header authentication was successful.');
            return;
        } else {
            context.info('Header authentication was NOT successful.');
            throw new ApplicationError(
                'Authentication error',
                403,
                errorResponseBody ?? 'No sophisticated credentials provided',
            );
        }
    };
};
