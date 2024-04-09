import { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { mock, mockDeep } from 'jest-mock-extended';

import { ApplicationError } from './error';
import sut from './headerAuthentication';
import { MiddlewareResult } from './middleware';

describe('The header authentication middleware should', () => {
    const contextMock = mock<InvocationContext>();
    const requestMock = mockDeep<HttpRequest>();
    const initialMiddlewareResult: MiddlewareResult<ReturnType<HttpHandler>> = { $failed: false, $result: undefined };

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    test('successfully resolves when the default "x-ms-client-principal" header is present', async () => {
        requestMock.headers.get.mockImplementationOnce((name) =>
            name === 'x-ms-client-principal-id' ? 'Test Principal' : null,
        );

        await expect(sut()(requestMock, contextMock, initialMiddlewareResult)).resolves.not.toThrow();
    });

    test('successfully resolves when the passed header validation function returns true', async () => {
        await expect(
            sut({ validateUsingHeaderFn: () => true })(requestMock, contextMock, initialMiddlewareResult),
        ).resolves.not.toThrow();
    });

    test('fail caused by missing default "x-ms-client-principal" header', async () => {
        // suppressing in order to enforce missing header
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        requestMock.headers['x-ms-client-principal-id'] = undefined;

        await expect(sut()(requestMock, contextMock, initialMiddlewareResult)).rejects.toEqual(
            new ApplicationError('Authentication error', 403, 'No sophisticated credentials provided'),
        );
    });

    test('fail caused by missing default "x-ms-client-principal" header and using the provided error body', async () => {
        // suppressing in order to enforce missing header
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        requestMock.headers['x-ms-client-principal-id'] = undefined;

        await expect(
            sut({ errorResponseBody: { error: 'Please authenticate properly' } })(
                requestMock,
                contextMock,
                initialMiddlewareResult,
            ),
        ).rejects.toEqual(new ApplicationError('Authentication error', 403, { error: 'Please authenticate properly' }));
    });

    test('fail caused by passed header validation function returns false', async () => {
        await expect(
            sut({ validateUsingHeaderFn: () => false })(requestMock, contextMock, initialMiddlewareResult),
        ).rejects.toEqual(new ApplicationError('Authentication error', 403, 'No sophisticated credentials provided'));
    });

    test('fail caused by passed header validation function returns false and use the provided error body', async () => {
        await expect(
            sut({ validateUsingHeaderFn: () => false, errorResponseBody: { error: 'Please authenticate properly' } })(
                requestMock,
                contextMock,
                initialMiddlewareResult,
            ),
        ).rejects.toEqual(new ApplicationError('Authentication error', 403, { error: 'Please authenticate properly' }));
    });

    test('do nothing if the passed result indicates an error in a prev function and skipIfResultIsFaulty is true', async () => {
        await expect(
            sut({
                validateUsingHeaderFn: () => false,
                errorResponseBody: { error: 'Please authenticate properly' },
                skipIfResultIsFaulty: true,
            })(requestMock, contextMock, {
                $failed: true,
                $error: Error(),
            }),
        ).resolves.not.toThrow();
    });

    test('execute the function even if the passed result indicates an error in a prev function, but skipIfResultIsFaulty is false', async () => {
        await expect(
            sut({
                validateUsingHeaderFn: () => false,
                errorResponseBody: { error: 'Please authenticate properly' },
                skipIfResultIsFaulty: false,
            })(requestMock, contextMock, {
                $failed: true,
                $error: Error(),
            }),
        ).rejects.toEqual(new ApplicationError('Authentication error', 403, { error: 'Please authenticate properly' }));
    });
});
