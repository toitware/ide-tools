//@ts-check

"use strict";

const path = require("path");

module.exports = {
  "preset": "ts-jest",
  "transform": {
    "^.+\\.ts?$": "ts-jest"
  },
  "testMatch": ["<rootDir>/test/suite/*.test.ts"],
  "verbose": true,
  "testEnvironment": "./test/setup/vscode-environment.js",
  "modulePaths": ["<rootDir>"],
  "moduleNameMapper": {
    "vscode": path.join(__dirname, "test", "setup", "vscode.js")
  }
};
