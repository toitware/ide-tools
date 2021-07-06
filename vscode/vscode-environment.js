
import NodeEnvironment = require("jest-environment-node");
import vscode = require("vscode");

class VsCodeEnvironment extends NodeEnvironment {
  async setup(): Promise<void> {
    await super.setup();
    this.global.vscode = vscode;
  }

  async teardown(): Promise<void> {
    this.global.vscode = {};
    await super.teardown();
  }
}

module.exports = VsCodeEnvironment;
