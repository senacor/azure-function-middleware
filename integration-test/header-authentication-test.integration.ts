import axios from 'axios';
import waitTillFunctionReady from './waitTillFunctionReady';

describe('The example azure function is started and the header authentication should execute the request', () => {
    beforeAll(async () => {
        axios.defaults.validateStatus = (status) => {
            return Number.isInteger(status);
        };
        await waitTillFunctionReady(() => axios.post(`http://localhost:8080/api/authentication/`), 401)();
    });

    test('without an error, validating the passed default "x-ms-client-principal" header', async () => {
        const response = await axios.post(
            `http://localhost:8080/api/authentication/`,
            {},
            {
                headers: {
                    'x-ms-client-principal': 'Test Principal',
                },
            },
        );

        expect(response.status).toEqual(204);
    });

    test('with an error caused by the missing default "x-ms-client-principal" header', async () => {
        const response = await axios.post(`http://localhost:8080/api/authentication/`, {}, {});

        expect(response.status).toEqual(401);
    });
});
