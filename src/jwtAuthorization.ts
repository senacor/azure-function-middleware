import { AzureFunction, Context, ContextBindingData, HttpRequest } from '@azure/functions';
import { jwtDecode } from 'jwt-decode';

import { ApplicationError } from './error';

const evaluate = <T>(rule: Rule<T>, parameters: ContextBindingData, jwt: T) => {
    const pathParameter = rule.parameterExtractor(parameters);
    const jwtParameter = rule.jwtExtractor(jwt);
    return pathParameter === jwtParameter;
};

export type Rule<T> = {
    parameterExtractor: (parameters: ContextBindingData) => string;
    jwtExtractor: (jwt: T) => string;
};

export default <T>(rules: Rule<T>[], errorResponseBody?: unknown): AzureFunction => {
    return (context: Context, req: HttpRequest): Promise<void> => {
        const authorizationHeader = req.headers.authorization;
        const parameters = context.bindingData;
        if (authorizationHeader) {
            const token = authorizationHeader.split(' ')[1];
            if (token) {
                const jwt = jwtDecode<T>(token);
                const validationResult = rules
                    .map((ruleFunction) => evaluate(ruleFunction, parameters, jwt))
                    .reduce((previousValue, currentValue) => previousValue && currentValue);
                if (!validationResult) {
                    return Promise.reject(
                        new ApplicationError('Authorization error', 401, errorResponseBody ?? 'Unauthorized'),
                    );
                } else {
                    context.bindingData = { ...context.bindingData, ...{ jwt } };
                    return Promise.resolve();
                }
            }
        }
        return Promise.reject(new ApplicationError('Authorization error', 401, errorResponseBody ?? 'Unauthorized'));
    };
};
