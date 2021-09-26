export class ApplicationError<T> extends Error {
    status: number;
    body?: T;

    constructor(message: string, status: number, body?: T) {
        super(message);
        this.status = status;
        this.body = body;
    }
}
