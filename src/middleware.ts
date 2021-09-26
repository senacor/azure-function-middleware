import {Context, HttpRequest} from "@azure/functions";

const middleware = (handler: (context: Context, request: HttpRequest) => Promise<void>, middlewares: Array<(context: Context, request: HttpRequest) => Promise<void>>) =>
    async (context: Context, request: HttpRequest) => {
        try {
            for (const middlewareFunctions of middlewares) {
                await middlewareFunctions(context, request);
            }
            return handler(context, request);
        } catch (error) {
            context.log.error(error);
            if (error && error.status) {
                context.res = error;
                return;
            }
            context.res = {status: 500, body: 'Internal server error'};
        }
    }

export default middleware;
