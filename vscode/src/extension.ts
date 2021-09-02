// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { clean, gt } from "semver";
import { commands as Commands, env, ExtensionContext, Uri, window as Window } from "vscode";
import { activateTreeView, deactivateTreeView } from "./deviceView";
import { activateLsp, deactivateLsp } from "./lspClient";
import { activateToitStatusBar, createSetOrgCommand } from "./organization";
import { createOutputCommand } from "./output";
import { activateSerialView } from "./serialView";
import { createEnsureAuth } from "./toitAuth";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { createSerialMonitor } from "./toitMonitor";
import { createSerialProvision } from "./toitProvision";
import { createStartSimCommand, createStopSimCommand } from "./toitSimulator";
import { createUninstallCommand } from "./toitUninstall";
import { Context, revealDevice } from "./utils";
import cp = require("child_process");

const MIN_TOIT_VERSION = "1.8.0";

async function checkToitCLI(ctx: Context): Promise<boolean> {
  try {
    const version = clean(cp.execFileSync(ctx.toitExec, [ "version", "-o", "short" ], {"encoding": "utf8"}));
    if (!version || gt(MIN_TOIT_VERSION, version)) {
      invalidCLIVersionPrompt(ctx, version);
      return false;
    }
  } catch (err) {
    if (err?.code === "ENOENT") {
      missingCLIPrompt();
    }
    return false;
  }
  return true;
}

async function invalidCLIVersionPrompt(ctx: Context, version?: string | null): Promise<void> {
  const updateToitAction = "Update toit executable";
  const action = await Window.showErrorMessage(`Toit executable${version ? ` ${version}` : ""} is outdated. Please update the executable to use the extension (reload window to activate the extension).`, updateToitAction);
  if (action === updateToitAction) {
    cp.execFileSync(ctx.toitExec, ["update"]);
  }
}

async function missingCLIPrompt() {
  const installAction = "Install";
  const settingsAction = "Update settings";
  const action = await Window.showErrorMessage("Could not find the `toit` executable. Please make sure `toit` is installed and set the toit.Path setting to the executable (reload the window to activate the extension).", installAction, settingsAction);
  if (action === installAction) {
    env.openExternal(Uri.parse("https://docs.toit.io/getstarted/installation"));
  } else if (action === settingsAction) {
    Commands.executeCommand( "workbench.action.openSettings", "toit.Path" );
  }
}

export async function activate(extContext: ExtensionContext): Promise<void> {
  const ctx = new Context();
  if (await checkToitCLI(ctx)) {
    Commands.executeCommand("setContext", "toit.extensionActive", true);

    activateTreeView(ctx);
    activateSerialView(ctx);

    extContext.subscriptions.push(Commands.registerCommand("toit.serialProvision", createSerialProvision(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.serialMonitor", createSerialMonitor(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.ensureAuth", createEnsureAuth(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.refreshDeviceView", () => ctx.views.refreshDeviceView()));
    extContext.subscriptions.push(Commands.registerCommand("toit.refreshSerialView", () => ctx.views.refreshSerialView()));
    extContext.subscriptions.push(Commands.registerCommand("toit.uninstallApp", createUninstallCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.devRun", createRunCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.devDeploy", createDeployCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.devLogs", createOutputCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.setOrganization", createSetOrgCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.stopSimulator", createStopSimCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.startSimulator", createStartSimCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.revealDevice", async(hwID) => await revealDevice(ctx, hwID)));

    activateToitStatusBar(ctx, extContext);
  }
  activateLsp(extContext);
}

export function deactivate(): Thenable<void> {
  Commands.executeCommand("setContext", "toit.extensionActive", false);
  deactivateTreeView();
  return deactivateLsp();
}
