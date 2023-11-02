import { Context } from '@azure/functions';

import { Options } from '../middleware';
import { stringify } from '../util/stringify';
import { ApplicationError } from './ApplicationError';

export const errorHandler = (
    error: unknown,
    context: Context,
    opts?: Options,
): {
    [key: string]: unknown;
} => {
    if (error instanceof ApplicationError) {
        context.log.error(`Received application error with message ${error.message}`);
        return {
            status: error.status,
            body: error.body,
        };
    }

    const errorAsString = stringify(error);
    context.log.error(errorAsString);

    if (opts?.errorResponseHandler === undefined) {
        return {
            status: 500,
            body: {
                message: 'Internal server error',
            },
        };
    } else {
        return opts.errorResponseHandler(error, context);
    }
};
