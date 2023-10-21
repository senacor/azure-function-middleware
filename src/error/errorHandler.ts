import { Context } from '@azure/functions';

import { Options } from '../middleware';
import { ApplicationError } from './ApplicationError';

type ErrorWithMessage = {
    message: string;
    stack?: string;
};

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
};

const logErrorObject = (error: object | null, context: Context) => {
    if (error === null) {
        context.log.error('The provided error was eq to null - unable to log a specific error-message');
        return;
    }

    if (isErrorWithMessage(error)) {
        context.log.error({ message: error.message, stack: error.stack });
    } else {
        try {
            const errorAsJson = JSON.stringify(error);
            if (errorAsJson === '{}') {
                context.log.error(error.toString());
            } else {
                context.log.error(errorAsJson); // Log the JSON string of the error object
            }
        } catch (_) {
            //Fallback in case there's an error stringify
            context.log.error(error.toString());
        }
    }
};

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

    switch (typeof error) {
        case 'string':
            context.log.error(error);
            break;
        case 'object':
            logErrorObject(error, context);
            break;
        default:
            context.log(`The error object has a type, that is not suitable for logging: ${typeof error}`);
    }

    if (opts?.errorResponseHandler === undefined) {
        return {
            status: 500,
            body: {
                message: 'Internal server error',
            },
        };
    } else {
        return opts.errorResponseHandler(error);
    }
};
