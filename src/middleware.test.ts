import { HttpRequest, InvocationContext } from '@azure/functions';
import { mock } from 'jest-mock-extended';

import { ApplicationError } from './error';
import { middleware as sut } from './middleware';

describe('The middleware layer should', () => {
    const contextMock = mock<InvocationContext>();
    const requestMock = mock<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('successfully call the passed functions without any middleware passed', async () => {
        const handlerMock = jest.fn();

        await sut([], handlerMock, [])(requestMock, contextMock);

        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
    });

    test('successfully call the middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(requestMock, contextMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
    });

    test('successfully call the pre middleware and post middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        const middlewarePostMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [middlewarePostMock])(requestMock, contextMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(middlewarePostMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
    });

    test('return an error when one middleware is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareOneMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(requestMock, contextMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $error: Error(), $failed: true });
        expect(handlerMock).not.toBeCalled();
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(contextMock.error).toBeCalled();
    });

    test('return an error when second middleware is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareTwoMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(requestMock, contextMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(handlerMock).not.toBeCalled();
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(contextMock.error).toBeCalled();
    });

    test('return an error when the handler function is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(requestMock, contextMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(contextMock.error).toBeCalled();
    });

    test('return an error when the handler function is failing and a error with status is returned', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(new ApplicationError('Validation Error', 401, 'test-body'));

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(requestMock, contextMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
        expect(res).toEqual({
            status: 401,
            body: 'test-body',
        });
        expect(contextMock.error).toBeCalled();
    });

    test('return an error if the handler function is failing, but execute the post-execution-functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock], handlerMock, [middlewareTwoMock])(requestMock, contextMock);

        expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $error: Error(), $failed: true });
        expect(contextMock.error).toBeCalled();
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

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [middlewarePostFunction], {
            errorResponseHandler,
        })(requestMock, contextMock);

        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
        expect(res).toEqual({
            status: 1337,
            body: 'My custom error response',
        });
        expect(contextMock.error).toBeCalled();
        expect(middlewarePostFunction).toHaveBeenCalledWith(requestMock, contextMock, {
            $error: Error(),
            $failed: true,
        });
    });

    test('dynamically filter items, which resolve to false', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        const middlewarePostOneMock = jest.fn();
        const middlewarePostTwoMock = jest.fn();
        const excludeFunction = () => false;
        const includeFunction = () => true;

        await sut([excludeFunction() && middlewareOneMock, middlewareTwoMock], handlerMock, [
            includeFunction() && middlewarePostOneMock,
            excludeFunction() && middlewarePostTwoMock,
        ])(requestMock, contextMock);

        expect(middlewareOneMock).not.toHaveBeenCalled();
        expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
        expect(middlewarePostOneMock).toHaveBeenCalledWith(requestMock, contextMock, {
            $failed: false,
            $result: undefined,
        });
        expect(middlewarePostTwoMock).not.toHaveBeenCalled();
    });

    describe('fail if error-handling is disabled and', () => {
        test('the first middleware (beforeExecution) is failing', async () => {
            const handlerMock = jest.fn();
            const middlewareOneMock = jest.fn();
            const middlewareTwoMock = jest.fn();
            middlewareOneMock.mockRejectedValue(Error());

            await expect(
                async () =>
                    await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                        requestMock,
                        contextMock,
                    ),
            ).rejects.toThrow();
            expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, {
                $failed: true,
                $error: Error(),
            });
            expect(handlerMock).not.toBeCalled();
        });

        test('the second middleware (beforeExecution) is failing', async () => {
            const handlerMock = jest.fn();
            const middlewareOneMock = jest.fn();
            const middlewareTwoMock = jest.fn();
            middlewareTwoMock.mockRejectedValue(Error());

            await expect(
                async () =>
                    await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                        requestMock,
                        contextMock,
                    ),
            ).rejects.toThrow();

            expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
            expect(handlerMock).not.toBeCalled();
        });

        test('the handler function is failing', async () => {
            const handlerMock = jest.fn();
            const middlewareOneMock = jest.fn();
            const middlewareTwoMock = jest.fn();
            handlerMock.mockRejectedValue(Error());

            await expect(
                async () =>
                    await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                        requestMock,
                        contextMock,
                    ),
            ).rejects.toThrow();

            expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
            expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
        });

        test('the handler function is failing and a error with status is returned', async () => {
            const handlerMock = jest.fn();
            const middlewareOneMock = jest.fn();
            const middlewareTwoMock = jest.fn();
            handlerMock.mockRejectedValue(new ApplicationError('Validation Error', 401, 'test-body'));

            await expect(
                async () =>
                    await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                        requestMock,
                        contextMock,
                    ),
            ).rejects.toThrow();

            expect(middlewareOneMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(requestMock, contextMock, { $failed: false });
            expect(handlerMock).toHaveBeenCalledWith(requestMock, contextMock);
        });
    });
});
