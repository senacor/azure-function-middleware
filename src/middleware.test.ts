import { HttpRequest, InvocationContext } from '@azure/functions';

import { ApplicationError } from './error';
import { middleware as sut } from './middleware';

describe('The middleware layer should', () => {
    const httpRequest = new HttpRequest({
        url: 'http://localhost:8080',
        method: 'GET',
    });
    let context = new InvocationContext();
    beforeEach(() => {
        jest.restoreAllMocks();
        context = new InvocationContext();
        jest.spyOn(context, 'error');
    });

    test('successfully call the passed functions without any middleware passed', async () => {
        const handlerMock = jest.fn();

        await sut([], handlerMock, [])(httpRequest, new InvocationContext());

        expect(handlerMock).toHaveBeenCalledWith(httpRequest, new InvocationContext());
    });

    test('successfully call the middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(httpRequest, context);

        expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
    });

    test('successfully call the pre middleware and post middleware and the passed functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        const middlewarePostMock = jest.fn();

        await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [middlewarePostMock])(httpRequest, context);

        expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(middlewarePostMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
    });

    test('return an error when one middleware is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareOneMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(httpRequest, context);

        expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, {
            $error: Error(),
            $failed: true,
        });
        expect(handlerMock).not.toHaveBeenCalled();
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(context.error).toHaveBeenCalled();
    });

    test('return an error when second middleware is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        middlewareTwoMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(httpRequest, context);

        expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(handlerMock).not.toHaveBeenCalled();
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(context.error).toHaveBeenCalled();
    });

    test('return an error when the handler function is failing', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(httpRequest, context);

        expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(context.error).toHaveBeenCalled();
    });

    test('return an error when the handler function is failing and a error with status is returned', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(new ApplicationError('Validation Error', 401, 'test-body'));

        const res = await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [])(httpRequest, context);

        expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
        expect(res).toEqual({
            status: 401,
            body: 'test-body',
        });
        expect(context.error).toHaveBeenCalled();
    });

    test('return an error if the handler function is failing, but execute the post-execution-functions', async () => {
        const handlerMock = jest.fn();
        const middlewareOneMock = jest.fn();
        const middlewareTwoMock = jest.fn();
        handlerMock.mockRejectedValue(Error());

        const res = await sut([middlewareOneMock], handlerMock, [middlewareTwoMock])(httpRequest, context);

        expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
        expect(res).toEqual({
            status: 500,
            jsonBody: {
                message: 'Internal server error',
            },
        });
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, {
            $error: Error(),
            $failed: true,
        });
        expect(context.error).toHaveBeenCalled();
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
        })(httpRequest, context);

        expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
        expect(res).toEqual({
            status: 1337,
            body: 'My custom error response',
        });
        expect(context.error).toHaveBeenCalled();
        expect(middlewarePostFunction).toHaveBeenCalledWith(httpRequest, context, {
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
        ])(httpRequest, context);

        expect(middlewareOneMock).not.toHaveBeenCalled();
        expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
        expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
        expect(middlewarePostOneMock).toHaveBeenCalledWith(httpRequest, context, {
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
                        httpRequest,
                        context,
                    ),
            ).rejects.toThrow();
            expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, {
                $failed: true,
                $error: Error(),
            });
            expect(handlerMock).not.toHaveBeenCalled();
        });

        test('the second middleware (beforeExecution) is failing', async () => {
            const handlerMock = jest.fn();
            const middlewareOneMock = jest.fn();
            const middlewareTwoMock = jest.fn();
            middlewareTwoMock.mockRejectedValue(Error());

            await expect(
                async () =>
                    await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                        httpRequest,
                        context,
                    ),
            ).rejects.toThrow();

            expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
            expect(handlerMock).not.toHaveBeenCalled();
        });

        test('the handler function is failing', async () => {
            const handlerMock = jest.fn();
            const middlewareOneMock = jest.fn();
            const middlewareTwoMock = jest.fn();
            handlerMock.mockRejectedValue(Error());

            await expect(
                async () =>
                    await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                        httpRequest,
                        context,
                    ),
            ).rejects.toThrow();

            expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
            expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
        });

        test('the handler function is failing and a error with status is returned', async () => {
            const handlerMock = jest.fn();
            const middlewareOneMock = jest.fn();
            const middlewareTwoMock = jest.fn();
            handlerMock.mockRejectedValue(new ApplicationError('Validation Error', 401, 'test-body'));

            await expect(
                async () =>
                    await sut([middlewareOneMock, middlewareTwoMock], handlerMock, [], { disableErrorHandling: true })(
                        httpRequest,
                        context,
                    ),
            ).rejects.toThrow();

            expect(middlewareOneMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
            expect(middlewareTwoMock).toHaveBeenCalledWith(httpRequest, context, { $failed: false });
            expect(handlerMock).toHaveBeenCalledWith(httpRequest, context);
        });
    });
});
