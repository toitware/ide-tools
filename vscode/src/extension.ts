// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { commands as Commands, ExtensionContext } from "vscode";
import { activateTreeView, deactivateTreeView } from "./deviceView";
import { activateLsp, deactivateLsp } from "./lspClient";
import { activateToitStatusBar, createSetOrgCommand } from "./organization";
import { activateSerialView } from "./serialView";
import { createEnsureAuth } from "./toitAuth";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { createSerialMonitor } from "./toitMonitor";
import { createSerialProvision } from "./toitProvision";
import { createStartSimCommand, createStopSimCommand } from "./toitSimulator";
import { createUninstallCommand } from "./toitUninstall";
import { Context, revealDevice } from "./utils";
import cp = require("child_process");
import compareVersions = require("compare-versions");

const MIN_TOIT_VERSION = "1.7.0";

async function checkToitCLI(ctx: Context): Promise<boolean> {
  return new Promise<boolean>( (resolve) => {
    cp.execFile(ctx.toitExec, [ "version", "-o", "json" ],
      (err, stdout) => {
        if (err?.code === "ENOENT") {
          // TODO(Lau): show action item.
          return resolve(false);
        }
        try {
          const info = JSON.parse(stdout);
          if (!info.version) return resolve(false);
          if (compareVersions(MIN_TOIT_VERSION, info.version.substring(1)) > 0) return resolve(false);
          // TODO: Add a version check.
          return resolve(true);
        } catch {
          // TODO(Lau): show action item.
          return resolve(false);
        }
      });
  });
}

export async function activate(extContext: ExtensionContext): Promise<void> {
  const ctx = new Context();
  if (!await checkToitCLI(ctx)) {
    return;
  }

  Commands.executeCommand("setContext", "toit.extensionActive", true);

  activateTreeView(ctx);
  activateSerialView(ctx);

  extContext.subscriptions.push(Commands.registerCommand("toit.serialProvision", createSerialProvision(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.serialMonitor", createSerialMonitor(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.ensureAuth", createEnsureAuth(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.refreshDeviceView", () => ctx.refreshDeviceView()));
  extContext.subscriptions.push(Commands.registerCommand("toit.refreshSerialView", () => ctx.refreshSerialView()));
  extContext.subscriptions.push(Commands.registerCommand("toit.uninstallApp", createUninstallCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.devRun", createRunCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.devDeploy", createDeployCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.setOrganization", createSetOrgCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.stopSimulator", createStopSimCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.startSimulator", createStartSimCommand(ctx)));
  extContext.subscriptions.push(Commands.registerCommand("toit.revealDevice", async(hwID) => await revealDevice(ctx, hwID)));

  activateToitStatusBar(ctx, extContext);
  activateLsp(extContext);
}

export function deactivate(): Thenable<void> {
  Commands.executeCommand("setContext", "toit.extensionActive", false);
  deactivateTreeView();
  return deactivateLsp();
}
