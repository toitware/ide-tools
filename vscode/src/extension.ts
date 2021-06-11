// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { commands as Commands, ExtensionContext } from "vscode";
import { activateLsp, deactivateLsp } from "./lspClient";
import { activateToitStatusBar, createSetOrgCommand } from "./organization";
import { activateSerialView } from "./serialView";
import { createEnsureAuth } from "./toitAuth";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { createSerialMonitor } from "./toitMonitor";
import { createSerialProvision } from "./toitProvision";
import { createStartSimCommand, createStopSimCommand } from "./toitSimulator";
import { createUninstallCommand } from "./toitUninstall";
import { activateTreeView, deactivateTreeView } from "./treeView";
import { Context } from "./utils";

export function activate(extContext: ExtensionContext): void {
  Commands.executeCommand("setContext", "toit.extensionActive", true);
  const ctx = new Context();
  activateTreeView(ctx);
  activateSerialView(ctx);

  extContext.subscriptions.push(Commands.registerCommand("toit.serialProvision", createSerialProvision(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.serialMonitor", createSerialMonitor(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.ensureAuth", createEnsureAuth(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.refreshView", () => ctx.refreshDeviceView()));
  extContext.subscriptions.push(Commands.registerCommand("toit.uninstallApp", createUninstallCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.devRun", createRunCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.devDeploy", createDeployCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.setOrganization", createSetOrgCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.stopSimulator", createStopSimCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.startSimulator", createStartSimCommand(ctx)));

  activateToitStatusBar(ctx, extContext);
  activateLsp(extContext);
}

export function deactivate(): Thenable<void> {
  Commands.executeCommand("setContext", "toit.extensionActive", false);
  deactivateTreeView();
  return deactivateLsp();
}
