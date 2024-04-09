import { HttpHandler, HttpRequestParams, app } from '@azure/functions';

import { middleware } from '../../src';
import authorization from '../../src/jwtAuthorization';

export const handler: HttpHandler = async (req, context) => {
    context.log('Function called');
    return { status: 204 };
};

app.http('test-jwt-authorization-function', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'authorization/{id}',
    handler: middleware<HttpHandler>(
        [
            authorization([
                {
                    parameterExtractor: (parameters: HttpRequestParams) => parameters.id,
                    jwtExtractor: (jwt: { userId: string }) => jwt.userId,
                },
            ]),
        ],
        handler,
        [],
    ),
});
