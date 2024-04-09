import { InvocationContext } from '@azure/functions';

import { Options } from '../middleware';
import { stringify } from '../util/stringify';
import { ApplicationError } from './ApplicationError';

export const errorHandler = (
    error: unknown,
    context: InvocationContext,
    opts?: Options,
): {
    [key: string]: unknown;
} => {
    if (error instanceof ApplicationError) {
        context.error(`Received application error with message ${error.message}`);

        if (typeof error.body === 'object') {
            return {
                status: error.status,
                jsonBody: error.body,
            };
        } else {
            return {
                status: error.status,
                body: stringify(error.body),
            };
        }
    }

    const errorAsString = stringify(error);
    context.error(errorAsString);

    if (opts?.errorResponseHandler === undefined) {
        return {
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        };
    } else {
        return opts.errorResponseHandler(error, context);
    }
};
