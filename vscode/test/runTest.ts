import * as path from "path";
import { runTests } from "vscode-test";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");

const vscodeVersion = pkg.engines.vscode.replace(/[^0-9.]/g, "");

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../");

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "../out/test/suite/index.js");

    // Download VS Code, unzip it and run the integration test
    console.log(`running tests... ext path: ${extensionTestsPath}`);
    await runTests({
      "version": vscodeVersion,
      extensionDevelopmentPath,
      extensionTestsPath
    });
  } catch (err) {
    console.error("Failed to run tests", err);
    process.exit(1);
  }
}

main();
