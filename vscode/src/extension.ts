"use strict";

import { commands as Commands, ExtensionContext, window as Window } from "vscode";
import { activateLsp, deactivateLsp } from "./lspClient";
import { activateToitStatusBar } from "./organization";
import { createEnsureAuth } from "./toitAuth";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { createSerialMonitor } from "./toitMonitor";
import { createSerialProvision } from "./toitProvision";
import { createUninstallCommand } from "./toitUninstall";
import { ToitDataProvider } from "./treeView";
import { CommandContext } from "./utils";

export function activate(context: ExtensionContext): void {
  Commands.executeCommand('setContext', 'toit.extensionActive', true);
  const cmdContext = new CommandContext();
  const deviceDataProvider = new ToitDataProvider(cmdContext);
  Window.createTreeView("toitDeviceView", { "treeDataProvider": deviceDataProvider } );

  context.subscriptions.push(Commands.registerCommand("toit.serialProvision", createSerialProvision(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.serialMonitor", createSerialMonitor(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.ensureAuth", createEnsureAuth(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.refreshView", () => deviceDataProvider.refresh()));
  context.subscriptions.push(Commands.registerCommand("toit.uninstallApp", createUninstallCommand(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.devRun", createRunCommand(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.devDeploy", createDeployCommand(cmdContext)));

  cmdContext.setDeviceProvider(deviceDataProvider);

  activateToitStatusBar(cmdContext, context);
  activateLsp(context);
}

export function deactivate(): Thenable<void> {
  Commands.executeCommand('setContext', 'toit.extensionActive', false);
  return deactivateLsp();
}
