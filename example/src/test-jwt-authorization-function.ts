import { HttpHandler, HttpRequestParams, app } from '@azure/functions';

import { middleware } from '../../src';
import authorization from '../../src/jwtAuthorization';

type JwtClaims = {
    sub: string;
    name: string;
};

export const handler: HttpHandler = async (req, context) => {
    const jwtClaims = context.extraInputs.get('jwt') as JwtClaims;

    context.log(`Function called by ${JSON.stringify(jwtClaims)}`);

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
                    jwtExtractor: (jwt: { sub: string }) => jwt.sub,
                },
            ]),
        ],
        handler,
        [],
    ),
});
