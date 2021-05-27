"use strict";

import { commands as Commands, ExtensionContext, window as Window } from "vscode";
import { activateLsp, deactivateLsp } from "./lspClient";
import { createEnsureAuth } from "./toitAuth";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { createSerialMonitor } from "./toitMonitor";
import { ToitDataProvider } from "./treeView";
import { createSerialProvision } from "./toitProvision";
import { CommandContext } from "./utils";

export function activate(context: ExtensionContext): void {
  const cmdContext = new CommandContext();
  context.subscriptions.push(Commands.registerCommand("toit.devRun", createRunCommand(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.devDeploy", createDeployCommand(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.serialProvision", createSerialProvision(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.serialMonitor", createSerialMonitor(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.ensureAuth", createEnsureAuth(cmdContext)));

  const deviceDataProvider = new ToitDataProvider(cmdContext);
  Window.createTreeView('toitDeviceView', { "treeDataProvider": deviceDataProvider } );
  context.subscriptions.push(Commands.registerCommand("toit.refreshView", () => deviceDataProvider.refresh()));


  activateLsp(context);
}

export function deactivate(): Thenable<void> {
  return deactivateLsp();
}
