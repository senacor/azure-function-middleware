import { Context, HttpRequest } from '@azure/functions';
import { ApplicationError } from './applicationError';

export type MiddlewareFunction = (context: Context, request: HttpRequest) => Promise<void>;

const middleware =
    (
        handler: (context: Context, request: HttpRequest) => Promise<void>,
        preFunctionMiddlewares?: MiddlewareFunction[],
        afterFunctionMiddlewares?: MiddlewareFunction[],
    ) =>
    async (context: Context, request: HttpRequest): Promise<void> => {
        try {
            if (preFunctionMiddlewares) {
                for (const middlewareFunctions of preFunctionMiddlewares) {
                    await middlewareFunctions(context, request);
                }
            }
            const handlerResult = await handler(context, request);
            if (afterFunctionMiddlewares) {
                for (const middleware of afterFunctionMiddlewares) {
                    await middleware(context, request);
                }
            }
            return handlerResult;
        } catch (error) {
            if (error instanceof ApplicationError) {
                context.log.error(`Received application error with message ${error.message}`);
                context.res = {
                    status: error.status,
                    body: error.body,
                };
                return;
            }
            context.log.error(error);
            context.res = {
                status: 500,
                body: {
                    message: 'Internal server error',
                },
            };
            return;
        }
    };

export default middleware;
