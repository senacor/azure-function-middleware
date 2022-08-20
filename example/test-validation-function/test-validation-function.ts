import { Context, HttpRequest } from '@azure/functions';
import middleware from '../../src/middleware';
import * as Joi from 'joi';
import validation from '../../src/validation';

const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
}).required();

const functionHandler = async (context: Context, req: HttpRequest): Promise<void> => {
    context.log.info('Function called');
    context.res = { status: 200, body: { text: `Hallo ${req.body.name}` } };
};

const afterFunction = (context: Context, request: HttpRequest): Promise<void> => {
    context.log('Called after function');
    return;
};

export default middleware(functionHandler, [validation(schema)], [afterFunction]);
