module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.integration.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/config/'],
    moduleDirectories: ['node_modules'],
    testTimeout: 30000,
    moduleNameMapper: {
        axios: 'axios/dist/node/axios.cjs',
    },
};
