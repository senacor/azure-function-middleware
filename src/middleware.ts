import { AzureFunction, Context } from '@azure/functions';

import { errorHandler } from './error';

type ErrorResult = { $failed: true; $error: unknown };

const isErrorResult = (result: unknown | ErrorResult): result is ErrorResult => (result as ErrorResult)?.$failed;

const middlewareCore =
    (beforeExecution: AzureFunction[], handler: AzureFunction, postExecution: AzureFunction[]) =>
    async (context: Context, ...args: unknown[]): Promise<unknown | ErrorResult> => {
        let error = undefined;

        if (beforeExecution) {
            for (const middlewareFunctions of beforeExecution) {
                try {
                    // TODO: Give before-execution functions a parameter to indicate if the handler failed. So each function has the ability to decide for itself, if it should get executed.
                    if (error === undefined) {
                        await middlewareFunctions(context, ...args);
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
            for (const middleware of postExecution) {
                await middleware(context, ...args);
            }
        }

        if (error !== undefined) {
            context.log.error(`An uncaught error occurred in the execution of the hander: ${error}`);
            return { $failed: true, $error: error };
        }
        return handlerResult;
    };

export type Options = {
    errorResponseHandler?: (error: unknown) => {
        [key: string]: unknown;
    };
    disableErrorHandling?: boolean;
};

async function middlewareWrapper(
    beforeExecution: AzureFunction[],
    handler: (context: Context, ...args: unknown[]) => Promise<unknown> | void,
    postExecution: AzureFunction[],
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
    (beforeExecution: AzureFunction[], handler: AzureFunction, postExecution: AzureFunction[], opts?: Options) =>
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
