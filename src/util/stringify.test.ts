import { ApplicationError } from '../error';
import { stringify } from './stringify';

describe('stringify should', () => {
    it('return string unmodified', () => {
        const input = 'test string';
        expect(stringify(input)).toEqual(input);
    });

    it('stringifies an error object with message and stack', () => {
        const error = new ApplicationError('conflict', 409);
        expect(stringify(error)).toContain(error.message);
    });

    it('stringifies a plain object correctly', () => {
        const input = { key: 'value' };
        expect(stringify(input)).toBe("{ key: 'value' }");
    });

    it('process number correctly', () => {
        expect(stringify(123)).toBe('123');
    });

    it('join multiple arguments with spaces', () => {
        expect(stringify('Test', 2, { message: 'World' })).toBe("Test 2 { message: 'World' }");
    });
});
