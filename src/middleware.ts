import { AzureFunction, Context } from '@azure/functions';

import { errorHandler } from './error';

type ErrorResult = { $failed: true; $error: unknown };

const isErrorResult = (result: unknown | ErrorResult): result is ErrorResult => (result as ErrorResult)?.$failed;

const middlewareCore =
    (beforeExecution: (AzureFunction | false)[], handler: AzureFunction, postExecution: (AzureFunction | false)[]) =>
    async (context: Context, ...args: unknown[]): Promise<unknown | ErrorResult> => {
        let error = undefined;

        if (beforeExecution) {
            const middlewareFunctions = beforeExecution.filter(
                (predicate): predicate is AzureFunction => predicate !== false,
            );
            for (const middlewareFunction of middlewareFunctions) {
                try {
                    // TODO: Give before-execution functions a parameter to indicate if the handler failed. So each function has the ability to decide for itself, if it should get executed.
                    if (error === undefined) {
                        await middlewareFunction(context, ...args);
                    }
                } catch (err) {
                    error = err;
                }
            }
        }

        let handlerResult;

        if (error === undefined) {
            try {
                handlerResult = await handler(context, ...args);
            } catch (err) {
                error = err;
            }
        }

        // TODO: Give post-execution functions a parameter to indicate if the handler failed. So each function has the ability to decide for itself, if it should get executed.
        if (postExecution) {
            const middlewareFunctions = postExecution.filter(
                (predicate): predicate is AzureFunction => predicate !== false,
            );
            for (const middlewareFunction of middlewareFunctions) {
                await middlewareFunction(context, ...args);
            }
        }

        if (error !== undefined) {
            context.log.error(`An uncaught error occurred in the execution of the handler: ${error}`);
            return { $failed: true, $error: error };
        }
        return handlerResult;
    };

export type Options = {
    errorResponseHandler?: (
        error: unknown,
        context: Context,
    ) => {
        [key: string]: unknown;
    };
    disableErrorHandling?: boolean;
};

async function middlewareWrapper(
    beforeExecution: (AzureFunction | false)[],
    handler: (context: Context, ...args: unknown[]) => Promise<unknown> | void,
    postExecution: (AzureFunction | false)[],
    context: Context,
    args: unknown[],
    opts?: Options,
) {
    const result = await middlewareCore(beforeExecution, handler, postExecution)(context, ...args);

    if (isErrorResult(result)) {
        if (opts?.disableErrorHandling) {
            throw result.$error;
        }

        context.res = errorHandler(result.$error, context, opts);
        return;
    }

    return result;
}

export const middleware =
    (
        beforeExecution: (AzureFunction | false)[],
        handler: AzureFunction,
        postExecution: (AzureFunction | false)[],
        opts?: Options,
    ) =>
    async (context: Context, ...args: unknown[]): Promise<unknown> => {
        if (opts?.disableErrorHandling) {
            return await middlewareWrapper(beforeExecution, handler, postExecution, context, args, opts);
        }

        try {
            return await middlewareWrapper(beforeExecution, handler, postExecution, context, args, opts);
        } catch (error) {
            context.res = errorHandler(error, context, opts);
        }
    };
