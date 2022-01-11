import { Context, ContextBindingData } from '@azure/functions';
import middleware from '../../src/middleware';
import authorization from '../../src/jwtAuthorization';

const functionHandler = async (context: Context): Promise<void> => {
    context.log.info('Function called');
    context.res = { status: 204 };
};

export default middleware(functionHandler, [
    authorization([
        {
            parameterExtractor: (parameters: ContextBindingData) => parameters.id,
            jwtExtractor: (jwt: { userId: string }) => jwt.userId,
        },
    ]),
]);
