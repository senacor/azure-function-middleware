module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/*.integration.ts'
    ],
    testTimeout: 10000,
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/config/"],
    moduleDirectories: [
        "node_modules"
    ],
    transformIgnorePatterns: ["node_modules/(?!axios)"],
}