import { HttpHandler, HttpRequestParams, app } from '@azure/functions';
import { jwtAuthorization, middleware } from '@senacor/azure-function-middleware';

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
    route: 'account/{accountId}',
    handler: middleware<HttpHandler>(
        [
            jwtAuthorization([
                {
                    parameterExtractor: (parameters: HttpRequestParams) => parameters.accountId,
                    jwtExtractor: (jwt: { sub: string }) => jwt.sub,
                },
            ]),
        ],
        handler,
        [],
    ),
});
