// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { commands as Commands, env, ExtensionContext, Uri, window as Window, workspace as Workspace } from "vscode";
import { activateTreeView, deactivateTreeView } from "./deviceView";
import { createJagFlashCommand, createJagMonitorCommand, createJagRunCommand, createJagScanCommand, createJagWatchCommand } from "./jagCmds";
import { JagContext } from "./jagCtx";
import { activateLsp, deactivateLsp } from "./lspClient";
import { createOutputCommand } from "./output";
import { activateToitStatusBar, createSetProjectCommand } from "./projectCmd";
import { activateSerialView } from "./serialView";
import { createEnsureAuth } from "./toitAuth";
import { createDeployCommand, createRunCommand } from "./toitExec";
import { createSerialMonitor } from "./toitMonitor";
import { createSerialProvision } from "./toitProvision";
import { createUninstallCommand } from "./toitUninstall";
import { Context, revealDevice, TOIT_LSP_ARGS } from "./utils";

import cp = require("child_process");
import wh = require("which");

interface RunResult {
  executableExists : boolean;
  error : unknown;
  // The output, if an executable was found and returned a value.
  // If the executable exists, but the output is null, then the program crashed.
  output : string | null;
}

interface CodeError {
  code : string;
}

function run(exec: string, args: Array<string>): RunResult {
  try {
    const output = cp.execFileSync(exec, args, {"encoding": "utf8"});
    return {
      "executableExists": true,
      "error": null,
      "output": output
    };
  } catch (err) {
    return {
      "executableExists": (err as CodeError)?.code !== "ENOENT",
      "error": err,
      "output": null
    };
  }
}

// Checks that the executable exists and executed normally.
function runCheck(exec: string, args: Array<string>): boolean {
  const result = run(exec, args);
  return result.executableExists && result.output !== null;
}

function isJagSetup(jagExec: string) : boolean {
  let jagResult = run(jagExec, [ "setup", "--no-analytics", "--check" ]);
  if (jagResult.error) {
    // We temporarily try without the --no-analytics flag. The flag
    // was added in v1.6.3, so versions before that will complain.
    jagResult = run(jagExec, [ "setup", "--check" ]);
  }
  return !(jagResult.error);
}

async function missingJagSetupPrompt(jagExec: string) : Promise<boolean> {
  const setupJagAction = "Setup Jaguar";
  const action = await Window.showErrorMessage(`The Jaguar installation is incomplete.`, setupJagAction);
  if (action === setupJagAction) {
    cp.execFileSync(jagExec, ["setup"]);
  }
  if (isJagSetup(jagExec)) {
    Window.showInformationMessage(`Jaguar setup completed.`);
    return true;
  }
  Window.showWarningMessage(`Failed to set up Jaguar.`);
  return false;

}

async function missingLspPrompt() {
  const installJagAction = "Install Jaguar";
  let message = "Could not find the `jag` or `toit` executable. ";
  message += "Please make sure `jag` or `toit` is installed. If not in PATH, update ";
  message += "the 'jag.path' (or 'toit.path'). Then reload the window";
  const action = await Window.showErrorMessage(message, installJagAction);
  if (action === installJagAction) {
    env.openExternal(Uri.parse("https://github.com/toitlang/jaguar"));
  }
}

async function badExePrompt(name: string, path: string|null, exists: boolean, setting: string|null, error: unknown) {
  let message = "";
  if (!exists) {
    message = "The setting for '" + name + "' does not specify a valid executable";
  } else {
    message = "Running the " + name + " tool at '" + path + "' yielded an error";
  }
  if (error !== null) message += ": " + error;

  if (setting === null) {
    await Window.showErrorMessage(message);
  } else {
    const settingsAction = "Update settings";
    const action = await Window.showErrorMessage(message, settingsAction);
    if (action === settingsAction) {
      Commands.executeCommand( "workbench.action.openSettings", setting);
    }
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
  jag: string | null;
}

async function findExecutable(tool : string, configPath : string|null, envPath : string, setting : string|null, checkArgs : Array<string>) : Promise<string|null> {
  let exec: string|null = configPath;
  let check: RunResult|null = null;
  if (exec === null) {
    // No configuration. We try to find it in the PATH.
    check = run(envPath, checkArgs);
    if (check.executableExists) {
      exec = envPath;
    }
  } else {
    check = run(exec, checkArgs);
  }
  if (exec === null) return null;
  if (!check.executableExists) {
    // Can only happen if the user specified a path in the settings.
    await badExePrompt(tool, exec, false, setting, null);
    return null;
  }
  const error = check.error;
  if (error !== null) {
    await badExePrompt(tool, exec, true, configPath ? setting : null, error);
    return null;
  }
  return exec;
}

async function findExecutables(): Promise<Executables> {
  let configCli = Workspace.getConfiguration("toit").get("path");
  let configLspCommand = Workspace.getConfiguration("toitLanguageServer").get("command");
  let configJag = Workspace.getConfiguration("jag").get("path");

  if (configCli === "") configCli = null;
  if (configLspCommand instanceof Array && configLspCommand.length === 0) configLspCommand = null;
  if (configJag === "") configJag = null;

  if (configCli !== null) {
    if (typeof configCli !== "string") {
      await badSetting("toit.path");
      return {
        "cli": null,
        "lspCommand": null,
        "jag": null
      };
    }
  }
  if (configLspCommand !== null) {
    if (!(configLspCommand instanceof Array) ||
        configLspCommand.some((entry) => typeof entry !== "string")) {
      await badSetting("toitLanguageServer.command");
      return {
        "cli": null,
        "lspCommand": null,
        "jag": null
      };
    }
  }
  if (configJag !== null) {
    if (typeof configJag !== "string") {
      await badSetting("toit.jag");
      return {
        "cli": null,
        "lspCommand": null,
        "jag": null
      };
    }
  }

  const cliVersionArgs =  [ "version", "-o", "short" ];
  const cliExec = await findExecutable("toit", configCli, "toit", "toit.path", cliVersionArgs);

  const jagVersionArgs = [ "version", "--no-analytics" ];
  let jagExec: string|null = await findExecutable("jag", configJag, "jag", "jag.path", jagVersionArgs);
  if (jagExec === null) {
    // We temporarily try without the --no-analytics flag. The flag
    // was added in v1.6.3, so versions before that will complain.
    jagExec = await findExecutable("jag", configJag, "jag", "jag.path", [ "version" ]);
  }
  if (jagExec !== null) {
    if (!isJagSetup(jagExec)) {
      const success = await missingJagSetupPrompt(jagExec);
      if (!success) jagExec = null;
    }
  }

  let lspCommand: Array<string>|null = null;
  if (configLspCommand !== null) {
    lspCommand = configLspCommand;
  } else if (jagExec !== null) {
    lspCommand = [ jagExec, "toit", "lsp", "--" ];
  } else if (cliExec !== null) {
    lspCommand = [cliExec];
    lspCommand.push(...TOIT_LSP_ARGS);
  } else if (runCheck("toit.lsp", ["version"]) && runCheck("toit.compile", ["--version"])) {
    // Found the language server in the PATH.
    const fullToitcPath = wh.sync("toit.compile", {"nothrow": true});
    if (fullToitcPath !== null) {  // Should be rare, since we just succeeded.
      lspCommand = [ "toit.lsp", "--toitc", fullToitcPath ];
    }
  }

  if (cliExec === null && lspCommand === null && jagExec === null &&
      configCli === null && configLspCommand === null && configJag === null) {
    missingLspPrompt();
  }

  return {
    "cli": cliExec,
    "lspCommand": lspCommand,
    "jag": jagExec
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
    extContext.subscriptions.push(Commands.registerCommand("toit.revealDevice", async(hwID) => await revealDevice(ctx, hwID)));

    activateToitStatusBar(ctx, extContext);
  }
  if (executables.lspCommand !== null) {
    activateLsp(extContext, executables.lspCommand);
  }
  if (executables.jag !== null) {
    Commands.executeCommand("setContext", "jag.execPresent", true);

    const ctx = new JagContext(executables.jag);

    extContext.subscriptions.push(Commands.registerCommand("jag.watch", createJagWatchCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("jag.run", createJagRunCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("jag.monitor", createJagMonitorCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("jag.scan", createJagScanCommand(ctx)));
    extContext.subscriptions.push(Commands.registerCommand("jag.flash", createJagFlashCommand(ctx)));
  }
}

export function deactivate(): Thenable<void> {
  Commands.executeCommand("setContext", "toit.extensionActive", false);
  deactivateTreeView();
  return deactivateLsp();
}
