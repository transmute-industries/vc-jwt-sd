/* eslint-disable no-undef */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['example', 'attic'],
  coverageReporters: ['json-summary'],
  "extensionsToTreatAsEsm": [".ts"],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {//the content you'd placed at "global"
      "useESM": true
    }]
  },
};