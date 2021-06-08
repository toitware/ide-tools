"use strict";

import { commands as Commands, ExtensionContext, window as Window } from "vscode";
import { activateLsp, deactivateLsp } from "./lspClient";
import { activateToitStatusBar, createSetOrgCommand } from "./organization";
import { createEnsureAuth } from "./toitAuth";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { createSerialMonitor } from "./toitMonitor";
import { createSerialProvision } from "./toitProvision";
import { createStopSimCommand } from "./toitSimulator";
import { createUninstallCommand } from "./toitUninstall";
import { ToitDataProvider } from "./treeView";
import { CommandContext } from "./utils";



export function activate(context: ExtensionContext): void {
  Commands.executeCommand("setContext", "toit.extensionActive", true);
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
  context.subscriptions.push(Commands.registerCommand("toit.setOrganization", createSetOrgCommand(cmdContext)));
  context.subscriptions.push(Commands.registerCommand("toit.stopSimulator", createStopSimCommand(cmdContext)));

  cmdContext.setDeviceProvider(deviceDataProvider);

  activateToitStatusBar(cmdContext, context);
  activateLsp(context);
}

export function deactivate(): Thenable<void> {
  Commands.executeCommand("setContext", "toit.extensionActive", false);
  return deactivateLsp();
}
