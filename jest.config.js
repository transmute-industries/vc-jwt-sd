/* eslint-disable no-undef */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testTimeout: 5 * 60 * 60 * 1000,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['example', 'attic'],
  coverageReporters: ['json-summary'],
  // only needed for benchmarking
  // "extensionsToTreatAsEsm": [".ts"],
  // transform: {
  //   '^.+\\.js?$': ['ts-jest', { 
  //     "useESM": true
  //   }],
  //   '^.+\\.ts?$': ['ts-jest', { 
  //     "useESM": false
  //   }]
  // },
};