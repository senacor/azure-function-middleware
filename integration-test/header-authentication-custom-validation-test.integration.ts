import axios from 'axios';

describe('Endpoint with header authentication and custom validation should', () => {
    test('return success response if "my-authentication-header" header is set to "authenticated"', async () => {
        const response = await axios.get(`http://localhost:8080/api/header-authentication-custom-validation`, {
            headers: {
                'my-authentication-header': 'authenticated',
            },
        });

        expect(response.status).toEqual(200);
    });

    test('return 403 response if "my-authentication-header" header is set to "invalid"', async () => {
        await expect(
            axios.get(`http://localhost:8080/api/header-authentication-custom-validation`, {
                headers: {
                    'my-authentication-header': 'invalid',
                },
            }),
        ).rejects.toThrow('Request failed with status code 403');
    });

    test('return 403 response if "my-authentication-header" header is missing', async () => {
        await expect(
            axios.get(`http://localhost:8080/api/header-authentication-custom-validation`, {}),
        ).rejects.toThrow('Request failed with status code 403');
    });
});
