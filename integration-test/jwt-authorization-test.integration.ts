import axios from 'axios';

import waitTillFunctionReady from './waitTillFunctionReady';

// Token generated with https://jwt.io/ containing the "sub" "c8e65ca7-a008-4b1c-b52a-4ad0ee417017"
const sampleToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjOGU2NWNhNy1hMDA4LTRiMWMtYjUyYS00YWQwZWU0MTcwMTciLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.TYD4sZM42CWiIPlKm4n2uesaGHRi_priukmc4xSn0K0';

describe('The example azure function is started and the JWT authorization should execute the request', () => {
    beforeAll(async () => {
        axios.defaults.validateStatus = (status) => {
            return Number.isInteger(status);
        };
        await waitTillFunctionReady(
            () => axios.post(`http://localhost:8080/api/authorization/c8e65ca7-a008-4b1c-b52a-4ad0ee417017`),
            401,
        )();
    });

    test('without an error, validating the id in the path (c8e65ca7-a008-4b1c-b52a-4ad0ee417017) against the token', async () => {
        const response = await axios.post(
            `http://localhost:8080/api/authorization/c8e65ca7-a008-4b1c-b52a-4ad0ee417017`,
            {},
            {
                headers: {
                    Authorization: `Basic ${sampleToken}`,
                },
            },
        );

        expect(response.status).toEqual(204);
    });

    test('with an id as path parameter that is not contained in the sample token, resulting in an Unauthorized', async () => {
        const response = await axios.post(
            `http://localhost:8080/api/authorization/other-id`,
            {},
            {
                headers: {
                    Authorization: `Basic ${sampleToken}`,
                },
            },
        );

        expect(response.status).toEqual(401);
    });

    test('without a token, resulting in an Unauthorized', async () => {
        const response = await axios.post(
            `http://localhost:8080/api/authorization/c8e65ca7-a008-4b1c-b52a-4ad0ee417017`,
        );

        expect(response.status).toEqual(401);
    });
});
