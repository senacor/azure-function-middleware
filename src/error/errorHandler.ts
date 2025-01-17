import { InvocationContext } from '@azure/functions';

import { Options } from '../middleware';
import { stringify } from '../util/stringify';
import { ApplicationError } from './ApplicationError';

export const errorHandler = (
    error: unknown,
    context: InvocationContext,
    opts?: Options,
    // TODO: Can we remove any?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
    context.error(error);

    if (opts?.errorResponseHandler === undefined) {
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
        } else {
            return {
                status: 500,
                jsonBody: {
                    message: 'Internal server error',
                },
            };
        }
    } else {
        return opts.errorResponseHandler(error, context);
    }
};
