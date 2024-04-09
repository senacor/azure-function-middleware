import { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { mockDeep } from 'jest-mock-extended';
import * as JWTDecoder from 'jwt-decode';

import { ApplicationError } from './error';
import sut from './jwtAuthorization';
import { MiddlewareResult } from './middleware';

jest.mock('jwt-decode');
const jwtMock = JWTDecoder as jest.Mocked<typeof JWTDecoder>;
describe('The authorization middleware should', () => {
    const requestMock = mockDeep<HttpRequest>();
    const initialMiddlewareResult: MiddlewareResult<ReturnType<HttpHandler>> = { $failed: false, $result: undefined };

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    test('successfully validate the passed authorization token', () => {
        requestMock.headers.get.mockImplementationOnce((name) => (name === 'authorization' ? 'Bearer token' : null));
        jwtMock.jwtDecode.mockReturnValue('JWT-TEST');
        const context = new InvocationContext();

        sut([
            {
                jwtExtractor: (input) => {
                    expect(input).toEqual('JWT-TEST');
                    return 'test';
                },
                parameterExtractor: () => 'test',
            },
        ])(requestMock, context, initialMiddlewareResult);

        expect(context.extraInputs.get('jwt')).toEqual('JWT-TEST');
    });

    test('fail caused by missing authorization header', () => {
        requestMock.headers.get.mockReturnValue(null);
        const jwtExtractorMock = jest.fn();
        const parameterExtractorMock = jest.fn();

        expect(() =>
            sut([{ jwtExtractor: jwtExtractorMock, parameterExtractor: parameterExtractorMock }])(
                requestMock,
                new InvocationContext(),
                initialMiddlewareResult,
            ),
        ).toThrow(new ApplicationError('Authorization error', 401));

        expect(jwtMock.jwtDecode).not.toHaveBeenCalled();
    });

    test('fail caused by a incorrectly formatted authorization header', () => {
        requestMock.headers.get.mockImplementationOnce((name) => (name === 'authorization' ? 'Bearer' : null));

        const jwtExtractorMock = jest.fn();
        const parameterExtractorMock = jest.fn();

        expect(() =>
            sut([{ jwtExtractor: jwtExtractorMock, parameterExtractor: parameterExtractorMock }])(
                requestMock,
                new InvocationContext(),
                initialMiddlewareResult,
            ),
        ).toThrow(new ApplicationError('Authorization error', 401));

        expect(jwtMock.jwtDecode).not.toHaveBeenCalled();
    });

    test('fail caused by second rule failing and therefore chaining failed', () => {
        requestMock.headers.get.mockImplementationOnce((name) => (name === 'authorization' ? 'Bearer' : null));
        jwtMock.jwtDecode.mockReturnValue('JWT-TEST');

        expect(() =>
            sut([
                {
                    jwtExtractor: () => 'test',
                    parameterExtractor: () => 'test',
                },
                {
                    jwtExtractor: () => 'failed',
                    parameterExtractor: () => 'test',
                },
            ])(requestMock, new InvocationContext(), initialMiddlewareResult),
        ).toThrow(new ApplicationError('Authorization error', 401, 'Unauthorized'));
    });
});
