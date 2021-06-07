"use strict";

import cp = require("child_process");
import { OutputChannel, window as Window } from "vscode";
import { Device, RelatedDevice } from "./device";
import { CommandContext, ensureAuth, selectDevice, SelectOptions as DeviceSelectOptions } from "./utils";

interface ExecConfig {
  cmd: string;
  extension: string;
  deviceSelection: DeviceSelectOptions;
  refreshView: boolean;
}

class RunConfig implements ExecConfig {
  static instance = new RunConfig();
  cmd: string = "run";
  extension: string = ".toit";
  deviceSelection: DeviceSelectOptions = { activeOnly: true, simulatorOnly: false };
  refreshView: boolean = false;
}

class DeployConfig implements ExecConfig {
  static instance = new DeployConfig();
  cmd: string = "deploy";
  extension: string = ".yaml";
  deviceSelection: DeviceSelectOptions = { activeOnly: false, simulatorOnly: false };
  refreshView: boolean = true;
}


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

async function executeCommand(ctx: CommandContext, config: ExecConfig, device?: Device) {
  let filePath: string;
  try {
    filePath = currentFilePath(ctx, config.extension);
  } catch (e) {
    return Window.showErrorMessage(`Unable to ${config.cmd} file: ${e.message}`);
  }

  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    if (!device) device = await selectDevice(ctx, config.deviceSelection);

    const commandProcess = cp.spawn("toit", [ "dev", "-d", device.name, config.cmd, filePath ]);
    const toitOutput: OutputChannel = ctx.outputChannel(device.deviceID, device.name);
    toitOutput.show();
    commandProcess.stdout.on("data", data => toitOutput.append(`${data}`));
    commandProcess.stderr.on("data", data => toitOutput.append(`${data}`));
    if (config.refreshView) ctx.refreshDeviceView();
    ctx.setLastFile(config.extension, filePath);
  } catch (e) {
    Window.showErrorMessage(`${capitalize(config.cmd)} app failed: ${e.message}`);
  }
}

export function createRunCommand(cmdContext: CommandContext): () => void {
  return (dev?: RelatedDevice) => {
    executeCommand(cmdContext, RunConfig.instance, dev?.device());
  };
}

export function createDeployCommand(cmdContext: CommandContext): () => void {
  return (dev?: RelatedDevice) => {
    executeCommand(cmdContext, DeployConfig.instance, dev?.device());
  };
}
