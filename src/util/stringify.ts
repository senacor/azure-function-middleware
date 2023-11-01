type ErrorWithMessage = {
    message: string;
    stack?: string;
};

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
};

const stringifyObject = (error: object | null): string => {
    if (error === null) {
        return 'The provided error was eq to null - unable to log a specific error-message';
    }

    if (error === undefined) {
        return 'The provided error was eq to undefined - unable to log a specific error-message';
    }

    if (isErrorWithMessage(error)) {
        return JSON.stringify({ message: error.message, stack: error.stack });
    } else {
        try {
            const errorAsJson = JSON.stringify(error);
            if (errorAsJson === '{}') {
                return error.toString();
            } else {
                return errorAsJson;
            }
        } catch (_) {
            //Fallback in case there's an error stringify
            return error.toString();
        }
    }
};

const unknownToString = (input: unknown) => {
    if (typeof input === 'object' && input !== null && 'toString' in input) return input.toString();
    return String(input);
};

const stringifySingleArgument = (arg: unknown): string => {
    switch (typeof arg) {
        case 'string':
            return arg;
        case 'object':
            return stringifyObject(arg);
        case 'number':
            return arg.toString();
        case 'boolean':
            return String(arg);
        default:
            return `The error object with value ${unknownToString(
                arg,
            )} has a type, that is not suitable for logging: ${typeof arg}`;
    }
};

export const stringify = (...args: unknown[]): string => {
    switch (typeof args) {
        case 'string':
            return args;
        case 'object':
            if (Array.isArray(args)) {
                return args.map((element) => stringifySingleArgument(element)).join(' ');
            }

            return stringifyObject(args[0]);
        default:
            return `The error object has a type, that is not suitable for logging: ${typeof args}`;
    }
};
