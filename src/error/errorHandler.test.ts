import { Context } from '@azure/functions';
import { mock } from 'jest-mock-extended';

import { ApplicationError } from './ApplicationError';
import { errorHandler as sut } from './errorHandler';

describe('Error-Handler should', () => {
    const contextMock = mock<Context>();

    beforeEach(() => {
        jest.restoreAllMocks();

        contextMock.log.error = jest.fn();
    });

    test('return an provided ApplicationError', () => {
        const res = sut(new ApplicationError('', 400, { error: 'critical' }), contextMock);
        expect(res.status).toStrictEqual(400);
        expect(res.body).toStrictEqual({ error: 'critical' });
    });

    test('return an default error-message, if no errorResponseHandler was provided', () => {
        const res = sut('Error!', contextMock);
        expect(res.status).toStrictEqual(500);
        expect(res.body).toStrictEqual({ message: 'Internal server error' });
    });

    test('use the errorResponseHandler, if an errorResponseHandler was provided', () => {
        const errorResponseHandler = () => ({
            status: 409,
            body: {
                message: 'conflict!',
            },
        });
        const res = sut('Error!', contextMock, { errorResponseHandler });
        expect(res.status).toStrictEqual(409);
        expect(res.body).toStrictEqual({ message: 'conflict!' });
    });
});
