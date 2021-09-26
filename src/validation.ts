import {Context, HttpRequest} from "@azure/functions";
import {Schema} from "joi";

export default (schema: Schema) => {
    return (context: Context, req: HttpRequest): Promise<void> => {
        const body = req.body;
        if (req.method !== 'GET' && body) {
            const validationResult = schema.validate(body);
            if (validationResult && validationResult.error) {
                context.log.verbose(validationResult);
                return Promise.reject({status: 400, body: validationResult.error.message});
            }
        }
        return Promise.resolve();
    }
}
