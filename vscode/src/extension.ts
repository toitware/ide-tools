// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { clean, gt } from "semver";
import { commands as Commands, env, ExtensionContext, Uri, window as Window, workspace as Workspace } from "vscode";
import { activateTreeView, deactivateTreeView } from "./deviceView";
import { activateLsp, deactivateLsp } from "./lspClient";
import { createOutputCommand } from "./output";
import { activateToitStatusBar, createSetProjectCommand } from "./projectCmd";
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

interface RunResult {
  executableExists : boolean;
  // The output, if an executable was found and returned a value.
  // If the executable exists, but the output is null, then the program crashed.
  output : string | null;
}

async function run(exec: string, args: Array<string>): Promise<RunResult> {
  try {
    const output = clean(cp.execFileSync(exec, args, {"encoding": "utf8"}));
    return {
      "executableExists": true,
      "output": output
    };
  } catch (err) {
    return {
      "executableExists": err?.code !== "ENOENT",
      "output": null
    };
  }
}

async function invalidCLIVersionPrompt(toitExec: string, version?: string | null): Promise<void> {
  const updateToitAction = "Update toit executable";
  const action = await Window.showErrorMessage(`Toit executable${version ? ` ${version}` : ""} is outdated. Please update the executable to use the extension (reload window to activate the extension).`, updateToitAction);
  if (action === updateToitAction) {
    cp.execFileSync(toitExec, ["update"]);
  }
}

async function missingCLIPrompt(path: string|null) {
  const installAction = "Install";
  const settingsAction = "Update settings";
  let message = "Could not find the `toit` executable";
  if (path !== null) {
    message += " at '" + path + "'";
  }
  message += ". Please make sure `toit` is installed and set the toit.path setting to the executable (reload the window to activate the extension";
  const action = await Window.showErrorMessage(message, installAction, settingsAction);
  if (action === installAction) {
    env.openExternal(Uri.parse("https://docs.toit.io/getstarted/installation"));
  } else if (action === settingsAction) {
    Commands.executeCommand( "workbench.action.openSettings", "toit.path" );
  }
}

async function badCLIPrompt(path: string|null) {
  const installAction = "Install";
  const settingsAction = "Update settings";
  let message = "The `toit` executable ";
  if (path !== null) {
    message += "at '" + path + "' ";
  }
  message += "was found but did not execute correctly.";
  const action = await Window.showErrorMessage(message, installAction, settingsAction);
  if (action === installAction) {
    env.openExternal(Uri.parse("https://docs.toit.io/getstarted/installation"));
  } else if (action === settingsAction) {
    Commands.executeCommand( "workbench.action.openSettings", "toit.path" );
  }
}

interface Executables {
  cli: string | null;
  lspCommand: Array<string> | null;
}

async function findExecutables(): Promise<Executables> {
  const configCli = Workspace.getConfiguration("toit").get("path");
  const configLspCommand = Workspace.getConfiguration("toitLanguageServer").get("command");

  let cliExec: string|null = null;
  let lspCommand: Array<string>|null = null;
  let cliVersion: string|null = null;

  if (configCli === null && configLspCommand === null) {
    // No configuration. We try to find it in the PATH.
    const check = await run("toit", [ "version", "-o", "short" ]);
    if (check.executableExists) {
      cliExec = "toit";
      cliVersion = check.output;
    } else {
      // Try to find the language server in the path.
      const lspResult = await run("toitlsp", ["version"]);
      if (lspResult.executableExists && lspResult.output !== null) {
        const toitcResult = await run("toitc", ["--version"]);
        if (toitcResult.executableExists && toitcResult.output !== null) {
          // Good enough for us.
          lspCommand = [ "toitlsp", "--toitc", "toitc" ];
        }
      }
    }
  } else if (typeof configCli === "string") {
    const check = await run(configCli, [ "version", "-o", "short" ]);
    cliVersion = check.output;
    if (check.executableExists) {
      cliExec = configCli;
      cliVersion = check.output;
    }
  }
  if (configLspCommand !== null) {
    lspCommand = configLspCommand as Array<string>;
  }

  if (cliExec === null && lspCommand === null) {
    await missingCLIPrompt(configCli as string);
  } else if (cliExec !== null) {
    if (cliVersion === null) {
      await badCLIPrompt(configCli as string);
      cliExec = null;
    } else if (gt(MIN_TOIT_VERSION, cliVersion)) {
      await invalidCLIVersionPrompt(cliExec, cliVersion);
      cliExec = null;
    } else if (lspCommand === null) {
      lspCommand = [ cliExec, "tool", "lsp" ];
    }
  }
  return {
    "cli": cliExec,
    "lspCommand": lspCommand
  };
}

export async function activate(extContext: ExtensionContext): Promise<void> {
  const executables = await findExecutables();
  if (executables.cli !== null) {
    const ctx = new Context(executables.cli);
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
    extContext.subscriptions.push(Commands.registerCommand("toit.setProject", createSetProjectCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.stopSimulator", createStopSimCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.startSimulator", createStartSimCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("toit.revealDevice", async(hwID) => await revealDevice(ctx, hwID)));

    activateToitStatusBar(ctx, extContext);
  }
  if (executables.lspCommand !== null) {
    activateLsp(extContext, executables.lspCommand);
  }
}

export function deactivate(): Thenable<void> {
  Commands.executeCommand("setContext", "toit.extensionActive", false);
  deactivateTreeView();
  return deactivateLsp();
}
