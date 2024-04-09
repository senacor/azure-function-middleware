import { FunctionHandler, HttpRequest, InvocationContext } from '@azure/functions';

import { errorHandler } from './error';
import { stringify } from './util/stringify';

export type ExceptionalResult = { $failed: true; $error: Error };
export type MiddlewareResult<T> = ExceptionalResult | { $failed: false; $result: Awaited<T | undefined> };

export type BeforeExecutionFunction<T = FunctionHandler> = T extends (...a: infer U) => infer R
    ? (...a: [...U, MiddlewareResult<R>]) => unknown
    : never;

export type PostExecutionFunction<T = FunctionHandler> = BeforeExecutionFunction<T>;

export const isErrorResult = <T>(result: MiddlewareResult<T> | ExceptionalResult): result is ExceptionalResult =>
    (result as ExceptionalResult)?.$failed;

const middlewareCore =
    <T extends FunctionHandler>(
        beforeExecution: (BeforeExecutionFunction<T> | false)[],
        handler: T,
        postExecution: (PostExecutionFunction<T> | false)[],
    ) =>
    async (request: HttpRequest, context: InvocationContext): Promise<ReturnType<T> | Error> => {
        let handlerResult: MiddlewareResult<ReturnType<T>> = { $failed: false, $result: undefined };

        if (beforeExecution) {
            const middlewareFunctions = beforeExecution.filter(
                (predicate): predicate is BeforeExecutionFunction<T> => predicate !== false,
            );
            for (const middlewareFunction of middlewareFunctions) {
                try {
                    await middlewareFunction(request, context, handlerResult);
                } catch (err) {
                    if (err instanceof Error) {
                        handlerResult = { $failed: true, $error: err };
                    }
                }
            }
        }

        if (!handlerResult.$failed) {
            try {
                handlerResult = { $failed: false, $result: await handler(request, context) };
            } catch (err) {
                if (err instanceof Error) {
                    handlerResult = { $failed: true, $error: err };
                }
            }
        }

        if (postExecution) {
            const middlewareFunctions = postExecution.filter(
                (predicate): predicate is PostExecutionFunction<T> => predicate !== false,
            );
            for (const middlewareFunction of middlewareFunctions) {
                await middlewareFunction(request, context, handlerResult);
            }
        }

        if (isErrorResult(handlerResult)) {
            context.error(`An uncaught error occurred in the execution of the handler: ${stringify(handlerResult)}`);
            return handlerResult.$error;
        }

        if (handlerResult.$result === undefined) {
            return new Error('Illegal-State: Result of the handler was empty.');
        }

        return handlerResult.$result;
    };

export type Options = {
    errorResponseHandler?: (
        error: unknown,
        context: InvocationContext,
    ) => {
        [key: string]: unknown;
    };
    disableErrorHandling?: boolean;
};

async function middlewareWrapper<T extends FunctionHandler>(
    beforeExecution: (BeforeExecutionFunction<T> | false)[],
    handler: T,
    postExecution: (PostExecutionFunction<T> | false)[],
    request: any,
    context: InvocationContext,
    opts?: Options,
) {
    const result = await middlewareCore(beforeExecution, handler, postExecution)(request, context);

    if (result instanceof Error) {
        if (opts?.disableErrorHandling) {
            throw result;
        }

        return errorHandler(result, context, opts);
    }

    return result;
}

export const middleware =
    <T extends FunctionHandler>(
        beforeExecution: (BeforeExecutionFunction<T> | false)[],
        handler: T,
        postExecution: (PostExecutionFunction<T> | false)[],
        opts?: Options,
    ) =>
    async (request: HttpRequest, context: InvocationContext): Promise<unknown> => {
        if (opts?.disableErrorHandling) {
            return await middlewareWrapper(beforeExecution, handler, postExecution, request, context, opts);
        }

        try {
            return await middlewareWrapper(beforeExecution, handler, postExecution, request, context, opts);
        } catch (error) {
            return errorHandler(error, context, opts);
        }
    };
