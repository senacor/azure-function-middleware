import { HttpHandler, app } from '@azure/functions';
import * as Joi from 'joi';
import { ObjectSchema } from 'joi';

import { PostExecutionFunction, middleware } from '../../src';
import { requestValidation as validation } from '../../src/validation';

const schema: ObjectSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
}).required();

export const functionHandler: HttpHandler = async (req, context) => {
    context.info('Function called');
    const body = (await req.json()) as { name: string };

    return { status: 200, jsonBody: { text: `Hallo ${body.name}` } };
};

const postFunction: PostExecutionFunction = (_, context) => {
    context.log('Called after function');
    return;
};

app.http('test-validation-function', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'validation',
    handler: middleware<HttpHandler>([validation(schema, { printRequest: true })], functionHandler, [postFunction]),
});
