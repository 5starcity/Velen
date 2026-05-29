module.exports = {
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["**/tests/unit/**/*.test.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: [],
};