import { mock } from 'jest-mock-extended';
import { Context, HttpRequest } from '@azure/functions';
import sut from './middleware';
import { ApplicationError } from './applicationError';

describe('The middleware layer should', () => {
    const contextMock = mock<Context>();
    const requestMock = mock<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();

        contextMock.log.error = jest.fn();
    });

    test('successfully call the middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();

        await sut(handlerMock, [middlewareOneMock, middlewareTwoMock])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });

    test('fail when one middleware is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareOneMock.mockRejectedValue(Error());

        await sut(handlerMock, [middlewareOneMock, middlewareTwoMock])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).not.toBeCalled();
        expect(handlerMock).not.toBeCalled();
        expect(contextMock.res).toEqual({
            status: 500,
            body: {
                message: 'Internal server error',
            },
        });
        expect(contextMock.log.error).toBeCalled();
    });

    test('fail when the second middleware is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareTwoMock.mockRejectedValue(Error());

        await sut(handlerMock, [middlewareOneMock, middlewareTwoMock])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).not.toBeCalled();
        expect(contextMock.res).toEqual({
            status: 500,
            body: {
                message: 'Internal server error',
            },
        });
        expect(contextMock.log.error).toBeCalled();
    });

    test('fail when the handler function is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(Error());

        await sut(handlerMock, [middlewareOneMock, middlewareTwoMock])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(contextMock.res).toEqual({
            status: 500,
            body: {
                message: 'Internal server error',
            },
        });
        expect(contextMock.log.error).toBeCalled();
    });

    test('fail when the handler function is failing and a error with status is returned', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(new ApplicationError('Validation Error', 401, 'test-body'));

        await sut(handlerMock, [middlewareOneMock, middlewareTwoMock])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(contextMock.res).toEqual({
            status: 401,
            body: 'test-body',
        });
        expect(contextMock.log.error).toBeCalled();
    });
});
