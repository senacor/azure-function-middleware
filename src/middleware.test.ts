import { Context, HttpRequest } from '@azure/functions';
import { mock } from 'jest-mock-extended';

import { ApplicationError } from './error';
import { middleware as sut } from './middleware';

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

    test('fail when one middleware is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareOneMock.mockRejectedValue(Error());

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock);

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

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock);

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

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock);

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

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(contextMock.res).toEqual({
            status: 401,
            body: 'test-body',
        });
        expect(contextMock.log.error).toBeCalled();
    });

    test('fail when the handler function is failing, but execute the post-execution-functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(Error());

        await sut([middlewareOneMock], handlerMock, [middlewareTwoMock])(contextMock, requestMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(contextMock.res).toEqual({
            status: 500,
            body: {
                message: 'Internal server error',
            },
        });
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(contextMock.log.error).toBeCalled();
    });

    test('use the provided error-handle to create a response', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        const middlewarePostFunction = jest.fn();
        handlerMock.mockRejectedValue(Error());

        const errorResponseHandler = () => {
            return {
                status: 1337,
                body: 'My custom error response',
            };
        };

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [middlewarePostFunction], {
            errorResponseHandler,
        })(contextMock, requestMock);

        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(contextMock.res).toEqual({
            status: 1337,
            body: 'My custom error response',
        });
        expect(contextMock.log.error).toBeCalled();
        // expect(middlewarePostFunction).toBeCalled(); TODO: Fix later
    });
});

describe('The middleware layer with disabled error-handling should', () => {
    const contextMock = mock<Context>();
    const requestMock = mock<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();

        contextMock.log.error = jest.fn();
    });

    test('successfully call the passed functions without any middleware passed', async () => {
        const handlerMock = jest.fn();

        await sut([], handlerMock, [], { disableErrorHandling: true })(contextMock, requestMock);

        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });

    test('successfully call the middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
            contextMock,
            requestMock,
        );

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });

    test('successfully call the pre middleware and post middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        const middlewarePostMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [middlewarePostMock], {
            disableErrorHandling: true,
        })(contextMock, requestMock);

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
            async () =>
                await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                    contextMock,
                    requestMock,
                ),
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
            async () =>
                await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                    contextMock,
                    requestMock,
                ),
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
            async () =>
                await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                    contextMock,
                    requestMock,
                ),
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
            async () =>
                await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                    contextMock,
                    requestMock,
                ),
        ).rejects.toThrow();

        expect(middlewareOneMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(middlewareTwoMock).toHaveBeenCalledWith(contextMock, requestMock);
        expect(handlerMock).toHaveBeenCalledWith(contextMock, requestMock);
    });
});
