import axios from 'axios';

import waitTillFunctionReady from './waitTillFunctionReady';

describe('The example azure function is started and the JOI validation should', () => {
    beforeAll(async () => {
        axios.defaults.validateStatus = (status) => {
            return Number.isInteger(status);
        };
        await waitTillFunctionReady(() => axios.post(`http://localhost:8080/api/validation`, { name: 'Test' }), 200)();
    });

    test('execute the request without an error', async () => {
        const testBody = { name: 'Test' };

        const response = await axios.post(`http://localhost:8080/api/validation`, testBody);

        expect(response.status).toEqual(200);
        expect(response.data).toEqual({ text: 'Hallo Test' });
    });

    test('execute the request with an incorrect payload, resulting in an bad request', async () => {
        // need 3 characters to be valid
        const testBody = { name: 'Te' };

        const response = await axios.post(`http://localhost:8080/api/validation`, testBody);

        expect(response.status).toEqual(400);
        expect(response.data).toEqual({ message: '"name" length must be at least 3 characters long' });
    });

    test('execute the request with an missing payload, resulting in an bad request', async () => {
        const responseEmptyBody = await axios.post(`http://localhost:8080/api/validation`, {});

        const responseUndefinedBody = await axios.post(`http://localhost:8080/api/validation`, undefined);

        expect(responseEmptyBody.status).toEqual(400);
        expect(responseEmptyBody.data).toEqual({ message: '"name" is required' });

        expect(responseUndefinedBody.status).toEqual(400);
        expect(responseUndefinedBody.data).toEqual({ message: 'Unexpected end of JSON input' });
    });
});
