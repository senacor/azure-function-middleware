import { Context, HttpRequest } from '@azure/functions';
import * as Joi from 'joi';
import { ObjectSchema } from 'joi';

import { middleware } from '../../src';
import validation from '../../src/validation';

const schema: ObjectSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
}).required();

const functionHandler = async (context: Context, req: HttpRequest): Promise<void> => {
    context.log.info('Function called');
    context.res = { status: 200, body: { text: `Hallo ${req.body.name}` } };
};

const afterFunction = (context: Context): Promise<void> => {
    context.log('Called after function');
    return;
};

export default middleware([validation(schema)], functionHandler, [afterFunction]);
