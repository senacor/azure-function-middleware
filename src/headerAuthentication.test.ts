import { Context, HttpRequest } from '@azure/functions';
import { mock } from 'jest-mock-extended';

import { ApplicationError } from './error';
import sut from './headerAuthentication';

describe('The header authentication middleware should', () => {
    const contextMock = mock<Context>();
    const requestMock = mock<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    test('successfully resolves when the default "x-ms-client-principal" header is present', async () => {
        requestMock.headers['x-ms-client-principal-id'] = 'Test Principal';

        await expect(sut()(contextMock, requestMock)).resolves.not.toThrow();
    });

    test('successfully resolves when the passed header validation function returns true', async () => {
        await expect(sut(() => true)(contextMock, requestMock)).resolves.not.toThrow();
    });

    test('fail caused by missing default "x-ms-client-principal" header', async () => {
        // suppressing in order to enforce missing header
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        requestMock.headers['x-ms-client-principal-id'] = undefined;

        await expect(sut()(contextMock, requestMock)).rejects.toEqual(
            new ApplicationError('Authentication error', 403, 'No sophisticated credentials provided'),
        );
    });

    test('fail caused by missing default "x-ms-client-principal" header and using the provided error body', async () => {
        // suppressing in order to enforce missing header
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        requestMock.headers['x-ms-client-principal-id'] = undefined;

        await expect(
            sut(undefined, { error: 'Please authenticate properly' })(contextMock, requestMock),
        ).rejects.toEqual(new ApplicationError('Authentication error', 403, { error: 'Please authenticate properly' }));
    });

    test('fail caused by passed header validation function returns false', async () => {
        await expect(sut(() => false)(contextMock, requestMock)).rejects.toEqual(
            new ApplicationError('Authentication error', 403, 'No sophisticated credentials provided'),
        );
    });

    test('fail caused by passed header validation function returns false and use the provided error body', async () => {
        await expect(
            sut(() => false, { error: 'Please authenticate properly' })(contextMock, requestMock),
        ).rejects.toEqual(new ApplicationError('Authentication error', 403, { error: 'Please authenticate properly' }));
    });
});
