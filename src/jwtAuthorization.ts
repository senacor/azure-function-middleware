import { HttpHandler } from '@azure/functions';
import { HttpRequestParams } from '@azure/functions/types/http';
import { jwtDecode } from 'jwt-decode';

import { ApplicationError } from './error';
import { BeforeExecutionFunction } from './middleware';

const evaluate = <T>(rule: Rule<T>, parameters: HttpRequestParams, jwt: T) => {
    const pathParameter = rule.parameterExtractor(parameters);
    const jwtParameter = rule.jwtExtractor(jwt);
    return pathParameter === jwtParameter;
};

export type Rule<T> = {
    parameterExtractor: (parameters: HttpRequestParams) => string;
    jwtExtractor: (jwt: T) => string;
};

export type JwtAuthorizationOptions = {
    skipIfResultIsFaulty: boolean;
};

export default <T>(
    rules: Rule<T>[],
    errorResponseBody?: unknown,
    opts?: Partial<JwtAuthorizationOptions>,
): BeforeExecutionFunction<HttpHandler> => {
    const skipIfResultIsFaulty = opts?.skipIfResultIsFaulty ?? true;

    return (req, context, result) => {
        if (skipIfResultIsFaulty && result.$failed) {
            context.info('Skipping jwt-authorization because the result is faulty.');
            return;
        }

        const authorizationHeader = req.headers.get('authorization');
        const parameters = req.params;
        if (authorizationHeader) {
            const token = authorizationHeader.split(' ')[1];
            if (token) {
                const jwt = jwtDecode<T>(token);
                const validationResult = rules
                    .map((ruleFunction) => evaluate(ruleFunction, parameters, jwt))
                    .reduce((previousValue, currentValue) => previousValue && currentValue);
                if (!validationResult) {
                    throw new ApplicationError('Authorization error', 401, errorResponseBody ?? 'Unauthorized');
                } else {
                    context.extraInputs.set('jwt', jwt);
                    return;
                }
            }
        }
        throw new ApplicationError('Authorization error', 401, errorResponseBody ?? 'Unauthorized');
    };
};
