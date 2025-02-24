module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.ts?(x)'],
    transform: {
        '^.+\\.tsx?': 'ts-jest'
    },
    clearMocks: true
};
