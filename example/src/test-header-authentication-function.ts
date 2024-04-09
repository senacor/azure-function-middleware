import { HttpRequest, InvocationContext, app } from '@azure/functions';

import { middleware } from '../../src';
import headerAuthentication from '../../src/headerAuthentication';

export const handler = async (request: HttpRequest, context: InvocationContext) => {
    context.info('Function called');
    return { status: 204 };
};
app.http('test-header-authentication-function', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'authentication',
    handler: middleware([headerAuthentication()], handler, []),
});
