export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        verbatimModuleSyntax: false,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'ESNext',
        moduleResolution: 'node'
      }
    }],
  },
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
    '^firebase/(.*)$': '<rootDir>/__mocks__/firebase/$1.ts',
    '^firebase-admin$': '<rootDir>/__mocks__/firebase-admin/index.ts',
    '^firebase-admin/(.*)$': '<rootDir>/__mocks__/firebase-admin/$1.ts',
    '^#imports$': '<rootDir>/tests/mocks/nuxt-imports.ts'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Separate configuration for integration tests
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          useESM: true,
          tsconfig: {
            verbatimModuleSyntax: false,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            module: 'ESNext',
            moduleResolution: 'node'
          }
        }],
      },
      moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/$1',
        '^firebase/(.*)$': '<rootDir>/__mocks__/firebase/$1.ts',
        '^firebase-admin$': '<rootDir>/__mocks__/firebase-admin/index.ts',
        '^firebase-admin/(.*)$': '<rootDir>/__mocks__/firebase-admin/$1.ts',
        '^#imports$': '<rootDir>/tests/mocks/nuxt-imports.ts'
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      testMatch: ['<rootDir>/tests/**/*.test.ts'],
      testPathIgnorePatterns: ['<rootDir>/tests/.*\\.integration\\.test\\.ts$'],
      setupFiles: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          useESM: true,
          tsconfig: {
            verbatimModuleSyntax: false,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            module: 'ESNext',
            moduleResolution: 'node'
          }
        }],
      },
      moduleNameMapper: {
        '^~/(.*)$': '<rootDir>/$1',
        '^firebase/(.*)$': '<rootDir>/__mocks__/firebase/$1.ts',
        '^firebase-admin$': '<rootDir>/__mocks__/firebase-admin/index.ts',
        '^firebase-admin/(.*)$': '<rootDir>/__mocks__/firebase-admin/$1.ts',
        '^#imports$': '<rootDir>/tests/mocks/nuxt-imports.ts'
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      testMatch: ['<rootDir>/tests/**/*.integration.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      globalSetup: '<rootDir>/tests/globalSetup.ts',
      globalTeardown: '<rootDir>/tests/globalTeardown.ts'
    }
  ]
};
