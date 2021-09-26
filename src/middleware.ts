import { Context, HttpRequest } from '@azure/functions';
import { ApplicationError } from './applicationError';

export type MiddlewareFunction = (context: Context, request: HttpRequest) => Promise<void>;

const middleware =
    (handler: (context: Context, request: HttpRequest) => Promise<void>, middlewares: MiddlewareFunction[]) =>
    async (context: Context, request: HttpRequest): Promise<void> => {
        try {
            for (const middlewareFunctions of middlewares) {
                await middlewareFunctions(context, request);
            }
            return await handler(context, request);
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
