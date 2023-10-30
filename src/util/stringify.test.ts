import { ApplicationError } from '../error';
import { stringify } from './stringify';

describe('stringify', () => {
    describe('when provided with a single argument', () => {
        it('returns the input string as is', () => {
            const input = 'test string';
            expect(stringify(input)).toBe(input);
        });

        it('stringifies an Error object with message and stack', () => {
            const error = new ApplicationError('conflict', 409);
            const result = stringify(error);
            expect(result).toContain(error.message);
        });

        it('stringifies a plain object correctly', () => {
            const input = { key: 'value' };
            expect(stringify(input)).toBe(JSON.stringify(input));
        });

        it('returns object.toString() for an empty object', () => {
            const input = {};
            expect(stringify(input)).toBe('[object Object]');
        });

        it('returns error message for null', () => {
            expect(stringify(null)).toBe('The provided error was eq to null - unable to log a specific error-message');
        });

        it('returns the number as a string for numbers', () => {
            expect(stringify(123)).toBe('123');
        });

        it('returns the boolean value as a string for booleans', () => {
            expect(stringify(true)).toBe('true');
            expect(stringify(false)).toBe('false');
        });

        it('handles symbols correctly', () => {
            expect(stringify(Symbol())).toContain('not suitable for logging: symbol');
        });

        it('handles functions correctly', () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            expect(stringify(function () {})).toContain('not suitable for logging: function');
        });

        it('handles cyclic objects by using toString', () => {
            const obj: any = {};
            obj.cycle = obj;
            expect(stringify(obj)).toBe(obj.toString());
        });
    });

    describe('when provided with multiple arguments', () => {
        it('joins stringified arguments with spaces', () => {
            const arg1 = 'Hello';
            const arg2 = { message: 'World' };
            expect(stringify(arg1, arg2)).toBe('Hello {"message":"World"}');
        });
    });
});
