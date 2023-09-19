import { mock } from 'jest-mock-extended';
import { Context, HttpRequest } from '@azure/functions';
import { middlewareWithoutErrorHandling as sut } from './middleware';
import { ApplicationError } from './applicationError';

describe('The middleware layer should', () => {
    const contextMock = mock<Context>();
    const requestMock = mock<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();

        contextMock.log.error = jest.fn();
    });

    test('successfully call the passed functions without any middleware passed', async () => {
        const handlerMock = jest.fn();

        await sut([], handlerMock, [])(contextMock, requestMock);

        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });

    test('successfully call the middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });

    test('successfully call the pre middleware and post middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        const middlewarePostMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [middlewarePostMock])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewarePostMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });

    test('fail when the first middleware (beforeExecution) is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareOneMock.mockRejectedValue(Error());

        await expect(
            async () => await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock),
        ).rejects.toThrow();
        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).not.toBeCalled();
        expect(handlerMock).not.toBeCalled();
    });

    test('fail when the second middleware (beforeExecution) is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareTwoMock.mockRejectedValue(Error());

        await expect(
            async () => await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock),
        ).rejects.toThrow();

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).not.toBeCalled();
    });

    test('fail when the handler function is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(Error());

        await expect(
            async () => await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock),
        ).rejects.toThrow();

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });

    test('fail when the handler function is failing and a error with status is returned', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(new ApplicationError('Validation Error', 401, 'test-body'));

        await expect(
            async () => await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock),
        ).rejects.toThrow();

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });
});
