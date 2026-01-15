const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  // Use node environment for API tests
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['**/tests/unit/page.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      globals: {
        'ts-jest': {
          tsconfig: 'tsconfig.test.json',
        },
      },
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '**/tests/unit/api/**/*.test.ts',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      globals: {
        'ts-jest': {
          tsconfig: 'tsconfig.test.json',
        },
      },
    },
  ],
}

module.exports = createJestConfig(customJestConfig)
