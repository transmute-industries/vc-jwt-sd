/* eslint-disable no-undef */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['example', 'attic'],
  coverageReporters: ['json-summary'],
  "extensionsToTreatAsEsm": [".ts"],
  transform: {
    '^.+\\.ts?$': ['ts-jest', { 
      "useESM": true
    }]
  },
};