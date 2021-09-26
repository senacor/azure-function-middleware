import { mock } from 'jest-mock-extended';
import { Context, HttpRequest } from '@azure/functions';
import * as JWTDecoder from 'jwt-decode';
import sut from './jwtAuthorization';
import { ApplicationError } from './applicationError';

jest.mock('jwt-decode');
const jwtMock = JWTDecoder as jest.Mocked<typeof JWTDecoder>;
describe('The authorization middleware should', () => {
    const contextMock = mock<Context>();
    const requestMock = mock<HttpRequest>();

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    test('successfully validate the passed authorization token', async () => {
        requestMock.headers.authorization = 'Bearer token';
        jwtMock.default.mockReturnValue('JWT-TEST');

        await sut([
            {
                jwtExtractor: (input) => {
                    expect(input).toEqual('JWT-TEST');
                    return 'test';
                },
                parameterExtractor: () => 'test',
            },
        ])(contextMock, requestMock);
    });

    test('fail caused by missing authorization header', async () => {
        requestMock.headers.authorization = undefined;
        const jwtExtractorMock = jest.fn();
        const parameterExtractorMock = jest.fn();

        await expect(
            sut([{ jwtExtractor: jwtExtractorMock, parameterExtractor: parameterExtractorMock }])(
                contextMock,
                requestMock,
            ),
        ).rejects.toEqual(new ApplicationError('Authorization error', 401));

        expect(jwtMock.default).not.toBeCalled();
    });

    test('fail caused by a incorrectly formatted authorization header', async () => {
        requestMock.headers.authorization = 'Bearer';
        const jwtExtractorMock = jest.fn();
        const parameterExtractorMock = jest.fn();

        await expect(
            sut([{ jwtExtractor: jwtExtractorMock, parameterExtractor: parameterExtractorMock }])(
                contextMock,
                requestMock,
            ),
        ).rejects.toEqual(new ApplicationError('Authorization error', 401));

        expect(jwtMock.default).not.toBeCalled();
    });

    test('fail caused by second rule failing and therefore chaining failed', async () => {
        requestMock.headers.authorization = 'Bearer token';
        jwtMock.default.mockReturnValue('JWT-TEST');

        await expect(
            sut([
                {
                    jwtExtractor: () => 'test',
                    parameterExtractor: () => 'test',
                },
                {
                    jwtExtractor: () => 'failed',
                    parameterExtractor: () => 'test',
                },
            ])(contextMock, requestMock),
        ).rejects.toEqual(new ApplicationError('Authorization error', 400, 'Unauthorized'));
    });
});
