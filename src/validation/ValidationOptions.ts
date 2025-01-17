import { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';

import { MiddlewareResult } from '../middleware';

export type ValidationOptions = Partial<{
    transformErrorMessage: (message: string) => unknown;
    extractValidationContentFromRequest: (
        req: HttpRequest,
        context: InvocationContext,
        result: MiddlewareResult<ReturnType<HttpHandler>>,
    ) => unknown;
    shouldThrowOnValidationError: boolean;
    skipIfResultIsFaulty: boolean;
    printInput: boolean;
}>;
