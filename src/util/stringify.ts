import { inspect } from 'node:util';

export function stringify(...args: unknown[]): string {
    return args.map((e) => stringifyValue(e)).join(' ');
}

function stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    return inspect(value, { depth: null, maxArrayLength: null, maxStringLength: null });
}
