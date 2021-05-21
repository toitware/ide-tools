"use strict";

import { commands as Commands, ExtensionContext } from "vscode";
import { activateLsp, deactivateLsp } from "./lspClient";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { CommandContext } from "./utils";

export function activate (context: ExtensionContext): void {
  const cmdContext = new CommandContext();
  context.subscriptions.push(Commands.registerCommand("toit.devRun", createRunCommand(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.devDeploy", createDeployCommand(cmdContext)));

  activateLsp(context);
}

export function deactivate(): Thenable<void> {
  return deactivateLsp();
}
