import { inspect } from 'node:util';

export function stringify(...args: unknown[]): string {
    return args.map((e) => stringifyValue(e)).join(' ');
}

function stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    if (isJsonSerializable(value)) {
        return JSON.stringify(value);
    }

    return inspect(value);
}

type JsonSerializable = {
    toJSON: () => unknown;
};

function isJsonSerializable(value: unknown): value is JsonSerializable {
    return typeof (value as JsonSerializable)?.toJSON === 'function';
}
