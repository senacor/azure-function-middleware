import { mock } from 'jest-mock-extended';
import { Context, HttpRequest } from '@azure/functions';
import * as JoiValidator from 'joi';
import { ValidationError } from 'joi';
import sut from './validation';
import { ApplicationError } from './applicationError';

jest.mock('joi');
describe('The joi validator should', () => {
    const contextMock = mock<Context>();
    const requestMock = mock<HttpRequest>();

    beforeEach(() => {
        contextMock.log.verbose = jest.fn();
        jest.restoreAllMocks();
    });

    test('successfully validate the passed object', async () => {
        requestMock.method = 'POST';
        requestMock.body = 'test-body';
        const schemaMock = mock<JoiValidator.ObjectSchema>();
        schemaMock.validate.mockReturnValue({ error: undefined, value: 'Test Validation' });

        const result = await sut(schemaMock)(contextMock, requestMock);

        expect(schemaMock.validate).toBeCalledWith('test-body');
        expect(result).toBeUndefined();
    });

    test('not call the validation when the method is GET', async () => {
        requestMock.method = 'GET';
        const schemaMock = mock<JoiValidator.ObjectSchema>();

        const result = await sut(schemaMock)(contextMock, requestMock);

        expect(schemaMock.validate).not.toBeCalled();
        expect(result).toBeUndefined();
    });

    test('not call the validation when the body is empty', async () => {
        requestMock.method = 'POST';
        requestMock.body = undefined;
        const schemaMock = mock<JoiValidator.ObjectSchema>();

        const result = await sut(schemaMock)(contextMock, requestMock);

        expect(schemaMock.validate).not.toBeCalled();
        expect(result).toBeUndefined();
    });

    test('fail when the validation was not successful', async () => {
        requestMock.method = 'POST';
        requestMock.body = 'test-body';
        const schemaMock = mock<JoiValidator.ObjectSchema>();
        const errorMock = mock<ValidationError>();
        schemaMock.validate.mockReturnValue({ error: errorMock, value: undefined });
        errorMock.message = 'Das ist ein Test';

        try {
            await sut(schemaMock)(contextMock, requestMock);
        } catch (error) {
            expect(error).toBeInstanceOf(ApplicationError);
            expect((error as ApplicationError<unknown>).status).toEqual(400);
            expect((error as ApplicationError<unknown>).body).toEqual({
                message: 'Das ist ein Test',
            });
        }

        expect(schemaMock.validate).toBeCalledWith('test-body');
    });

    test('fail when the validation was not successful with transformed error message', async () => {
        requestMock.method = 'POST';
        requestMock.body = 'test-body';
        const schemaMock = mock<JoiValidator.ObjectSchema>();
        const errorMock = mock<ValidationError>();
        schemaMock.validate.mockReturnValue({ error: errorMock, value: undefined });
        errorMock.message = 'Das ist ein Test';

        try {
            await sut(schemaMock, (message) => ({
                type: 'Validation Error',
                message,
            }))(contextMock, requestMock);
        } catch (error) {
            expect(error).toBeInstanceOf(ApplicationError);
            expect((error as ApplicationError<unknown>).status).toEqual(400);
            expect((error as ApplicationError<unknown>).body).toEqual({
                message: 'Das ist ein Test',
                type: 'Validation Error',
            });
        }
    });
});
