import {Context, ContextBindingData, HttpRequest} from "@azure/functions";
import jwtDecode from "jwt-decode";

const evaluate = <T>(ruleFunction: (parameterExtractor: (parameters: ContextBindingData) => string, jwtExtractor: (jwt: T) => string) => boolean, parameters: ContextBindingData, jwt: T) => {
    const parameter = para
    return undefined;
}

export default <T>(rules: [{ (parameterExtractor: (parameters: ContextBindingData) => string, jwtExtractor: (jwt: T) => string) }]) => {
    return (context: Context, req: HttpRequest): Promise<void> => {
        const authorizationHeader = req.headers.authorization;
        const parameters = context.bindingData;
        if (authorizationHeader) {
            const token = authorizationHeader.split(' ')[1];
            if (token) {
                const jwt = jwtDecode<T>(token);
                const validationResult = rules
                    .map(ruleFunction => evaluate(ruleFunction, parameters, jwt))
                    .reduce((previousValue, currentValue) => previousValue && currentValue);
                if (!validationResult) {
                    return Promise.reject({status: 400, body: 'Unauthorized'});
                }
            }
        }
        return Promise.resolve();
    }
}
