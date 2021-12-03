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
import { Context, revealDevice, TOIT_LSP_ARGS, TOIT_SHORT_VERSION_ARGS } from "./utils";

import cp = require("child_process");

const MIN_TOIT_VERSION = "1.8.0";

interface RunResult {
  executableExists : boolean;
  error : unknown;
  // The output, if an executable was found and returned a value.
  // If the executable exists, but the output is null, then the program crashed.
  output : string | null;
}

function run(exec: string, args: Array<string>): RunResult {
  try {
    const output = clean(cp.execFileSync(exec, args, {"encoding": "utf8"}));
    return {
      "executableExists": true,
      "error": null,
      "output": output
    };
  } catch (err) {
    return {
      "executableExists": err?.code !== "ENOENT",
      "error": err,
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

async function badCLIPrompt(path: string|null, error: unknown) {
  const installAction = "Install";
  const settingsAction = "Update settings";
  let message = "";
  if (path === null) {
    message = "The given 'toit' path did not execute correctly";
  } else {
    message = "Running '" + path + "' yielded an error";
  }
  if (error !== null) message += ": " + error;
  const action = await Window.showErrorMessage(message, installAction, settingsAction);
  if (action === installAction) {
    env.openExternal(Uri.parse("https://docs.toit.io/getstarted/installation"));
  } else if (action === settingsAction) {
    Commands.executeCommand( "workbench.action.openSettings", "toit.path" );
  }
}

async function badSetting(setting: string) {
  const settingsAction = "Update settings";
  const message = "Invalid setting for '" + setting + "'";
  const action = await Window.showErrorMessage(message, settingsAction);
  if (action === settingsAction) {
    Commands.executeCommand( "workbench.action.openSettings", setting);
  }
}

interface Executables {
  cli: string | null;
  lspCommand: Array<string> | null;
}

async function findExecutables(): Promise<Executables> {
  const configCli = Workspace.getConfiguration("toit").get("path");
  const configLspCommand = Workspace.getConfiguration("toitLanguageServer").get("command");

  if (configCli !== null) {
    if (typeof configCli !== "string") {
      await badSetting("toit.path");
      return {
        "cli": null,
        "lspCommand": null
      };
    }
  }
  if (configLspCommand !== null) {
    if (!(configLspCommand instanceof Array) ||
        configLspCommand.some((entry) => typeof entry !== "string")) {
      await badSetting("toitLanguageServer.command");
      return {
        "cli": null,
        "lspCommand": null
      };
    }
  }

  let cliExec: string|null = null;
  let cliError: unknown = null;
  let lspCommand: Array<string>|null = null;
  let cliVersion: string|null = null;

  if (configCli === null && configLspCommand === null) {
    // No configuration. We try to find it in the PATH.
    const check = run("toit", [ "version", "-o", "short" ]);
    if (check.executableExists) {
      cliExec = "toit";
      cliError = check.error;
      cliVersion = check.output;
    } else {
      // Try to find the language server in the path.
      const lspResult = run("toitlsp", ["version"]);
      if (lspResult.executableExists && lspResult.output !== null) {
        const toitcResult = run("toitc", ["--version"]);
        if (toitcResult.executableExists && toitcResult.output !== null) {
          // The toitlsp and toitc executables exist and don't crash.
          // We will try to use them as LSP.
          lspCommand = [ "toitlsp", "--toitc", "toitc" ];
        }
      }
    }
  } else if (typeof configCli === "string") {
    const check = run(configCli, TOIT_SHORT_VERSION_ARGS);
    cliError = check.error;
    cliVersion = check.output;
    if (check.executableExists) {
      cliExec = configCli;
    }
  }

  if (cliExec === null && lspCommand === null) {
    await missingCLIPrompt(configCli as string);
  } else if (cliExec !== null) {
    if (cliError !== null || cliVersion === null) {
      await badCLIPrompt(configCli as string, cliError);
      cliExec = null;
    } else if (gt(MIN_TOIT_VERSION, cliVersion)) {
      await invalidCLIVersionPrompt(cliExec, cliVersion);
      cliExec = null;
    } else if (lspCommand === null) {
      lspCommand = [cliExec];
      lspCommand.push(...TOIT_LSP_ARGS);
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
