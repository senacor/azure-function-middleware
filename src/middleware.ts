import { AzureFunction, Context } from '@azure/functions';
import { ApplicationError } from './applicationError';

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
            }
        } catch (_) {
            //Fallback in case there's an error stringify
            context.log.error(error.toString());
        }
    }
};

const middlewareCore =
    (beforeExecution: AzureFunction[], handler: AzureFunction, afterExecution: AzureFunction[]) =>
    async (context: Context, ...args: unknown[]): Promise<void> => {
        if (beforeExecution) {
            for (const middlewareFunctions of beforeExecution) {
                await middlewareFunctions(context, ...args);
            }
        }
        const handlerResult = await handler(context, ...args);
        if (afterExecution) {
            for (const middleware of afterExecution) {
                await middleware(context, ...args);
            }
        }
        return handlerResult;
    };

export type Options = {
    errorResponseHandler?: (error: unknown, context: Context) => void;
};

const middleware =
    (beforeExecution: AzureFunction[], handler: AzureFunction, postExecution: AzureFunction[], opts?: Options) =>
    async (context: Context, ...args: unknown[]): Promise<void> => {
        try {
            return await middlewareCore(beforeExecution, handler, postExecution)(context, ...args);
        } catch (error) {
            if (error instanceof ApplicationError) {
                context.log.error(`Received application error with message ${error.message}`);
                context.res = {
                    status: error.status,
                    body: error.body,
                };
                return;
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
                context.res = {
                    status: 500,
                    body: {
                        message: 'Internal server error',
                    },
                };
                return;
            } else {
                opts.errorResponseHandler(error, context);
                return;
            }
        }
    };

export default middleware;
export const middlewareWithoutErrorHandling = middlewareCore;
