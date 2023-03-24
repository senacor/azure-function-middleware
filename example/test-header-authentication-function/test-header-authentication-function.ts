import { Context } from '@azure/functions';
import middleware from '../../src/middleware';
import headerAuthentication from '../../src/headerAuthentication';

const functionHandler = async (context: Context): Promise<void> => {
    context.log.info('Function called');
    context.res = { status: 204 };
};

export default middleware([headerAuthentication()], functionHandler, []);
