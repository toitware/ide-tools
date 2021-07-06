import path = require("path");

console.log(`jest uses ${__dirname}`);

module.exports = {
  "testEnvironment": "./vscode-environment.js",
  "modulePaths": ["<rootDir>"],
  "moduleNameMapper": {
    "vscode": path.join(__dirname, "src", "test", "vscode.ts")
  },
  "verbose": true

};
