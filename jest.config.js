export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
    '^firebase/(.*)$': '<rootDir>/__mocks__/firebase/$1.ts',
    '^firebase-admin$': '<rootDir>/__mocks__/firebase-admin/index.ts'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'], // Only run unit tests
  setupFiles: ['<rootDir>/jest.setup.js'],
};
