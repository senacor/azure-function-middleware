import { AxiosResponse } from 'axios';

export default (testFunction: () => Promise<AxiosResponse>, expectedStatus: number) => async (): Promise<void> => {
    for (let counter = 0; counter < 10; counter++) {
        console.log('Try to communicate with function');

        const response = await testFunction();

        if (response.status === expectedStatus) {
            return;
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw Error('Function could not be started within 5 seconds');
};
