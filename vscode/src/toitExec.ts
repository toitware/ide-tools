"use strict";

import cp = require("child_process");
import { OutputChannel, window as Window } from "vscode";
import { Device, RelatedDevice } from "./device";
import { CommandContext, ensureAuth, selectDevice } from "./utils";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

async function executeCommand(ctx: CommandContext, cmd: string, extension: string, activeOnly: boolean, device?: Device) {
  let filePath: string;
  try {
    filePath = currentFilePath(ctx, extension);
  } catch (e) {
    return Window.showErrorMessage(`Unable to ${cmd} file: ${e.message}`);
  }

  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    if (!device) device = await selectDevice(ctx, activeOnly);

    const commandProcess = cp.spawn("toit", [ "dev", "-d", device.name, cmd, filePath ]);
    const toitOutput: OutputChannel = ctx.outputChannel(device.deviceID, device.name);
    toitOutput.show();
    commandProcess.stdout.on("data", data => toitOutput.append(`${data}`));
    commandProcess.stderr.on("data", data => toitOutput.append(`${data}`));
    ctx.refreshDeviceView();
    ctx.setLastFile(extension, filePath);
  } catch (e) {
    Window.showErrorMessage(`${capitalize(cmd)} app failed: ${e.message}`);
  }
}

export function createRunCommand(cmdContext: CommandContext): () => void {
  return (dev?: RelatedDevice) => {
    executeCommand(cmdContext, "run", ".toit", true, dev?.device());
  };
}

export function createDeployCommand(cmdContext: CommandContext): () => void {
  return (dev?: RelatedDevice) => {
    executeCommand(cmdContext, "deploy", ".yaml", false, dev?.device());
  };
}
