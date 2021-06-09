"use strict";

import cp = require("child_process");
import { OutputChannel, window as Window } from "vscode";
import { Device, RelatedDevice } from "./device";
import { CommandContext, ensureAuth, selectDevice } from "./utils";

function currentFilePath(ctx: CommandContext, suffix: string): string {
  const editor = Window.activeTextEditor;
  if (!editor) throw new Error("No active file.");

  const filePath = editor.document.fileName;
  if (!filePath.endsWith(suffix)) {
    const lastFile = ctx.getLastFile(suffix);
    if (lastFile) return lastFile;
    throw new Error(`Non-'${suffix}'-file: ${filePath}.`);
  }
  return filePath;
}

async function executeRunCommand(ctx: CommandContext, device?: Device) {
  let filePath: string;
  try {
    filePath = currentFilePath(ctx, ".toit");
  } catch (e) {
    return Window.showErrorMessage(`Unable to run file: ${e.message}`);
  }

  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    if (!device) device = await selectDevice(ctx, { "activeOnly": true, "simulatorOnly": false });

    const commandProcess = cp.spawn("toit", [ "dev", "-d", device.name, "run", filePath ]);
    const toitOutput: OutputChannel = ctx.outputChannel(device.deviceID, device.name);
    toitOutput.show();
    commandProcess.stdout.on("data", data => toitOutput.append(`${data}`));
    commandProcess.stderr.on("data", data => toitOutput.append(`${data}`));
    ctx.setLastFile(".toit", filePath);
  } catch (e) {
    Window.showErrorMessage(`Run app failed: ${e.message}`);
  }
}

async function executeDeployCommand(ctx: CommandContext, device?: Device) {
  let filePath: string;
  try {
    filePath = currentFilePath(ctx, ".yaml");
  } catch (e) {
    return Window.showErrorMessage(`Unable to run file: ${e.message}`);
  }

  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    if (!device) device = await selectDevice(ctx, { "activeOnly": false, "simulatorOnly": false });

    const commandProcess = cp.spawn("toit", [ "dev", "-d", device.name, "deploy", filePath ]);
    const toitOutput: OutputChannel = ctx.outputChannel(device.deviceID, device.name);
    toitOutput.show();
    commandProcess.stdout.on("data", data => toitOutput.append(`${data}`));
    commandProcess.stderr.on("data", data => toitOutput.append(`${data}`));
    ctx.refreshDeviceView();
    ctx.setLastFile(".yaml", filePath);
  } catch (e) {
    Window.showErrorMessage(`Deploy app failed: ${e.message}`);
  }
}

export function createRunCommand(cmdContext: CommandContext): () => void {
  return (dev?: RelatedDevice) => {
    executeRunCommand(cmdContext, RunConfig.instance, dev?.device());
  };
}

export function createDeployCommand(cmdContext: CommandContext): () => void {
  return (dev?: RelatedDevice) => {
    executeDeployCommand(cmdContext, DeployConfig.instance, dev?.device());
  };
}
