import {Context, HttpRequest} from "@azure/functions";
import middleware from "../../src/middleware";
import authorization from "../../src/authorization";
import * as Joi from "joi";
import validation from "../../src/validation";

const schema = Joi.object().keys({
    name: Joi.string().min(3).max(30).required(),
})

const functionHandler = async (context: Context, req: HttpRequest): Promise<void> => {
    console.log('Function called');
    context.res = {status: 201};
};

export default middleware(functionHandler, [authorization([]), validation(schema)]);
