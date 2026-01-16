import { HttpRequest, InvocationContext, app } from '@azure/functions';

import { headerAuthentication, middleware } from '../../src';

export const handler = async (request: HttpRequest, context: InvocationContext) => {
    context.info('Function called');
    return { status: 200, jsonBody: { response: 42 } };
};

app.http('test-header-authentication-custom-validation-function', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'header-authentication-custom-validation',
    handler: middleware(
        [
            headerAuthentication({
                validateUsingHeaderFn: async (headers: Headers) => {
                    return headers.get('my-authentication-header') === 'authenticated';
                },
            }),
        ],
        handler,
        [],
    ),
});
