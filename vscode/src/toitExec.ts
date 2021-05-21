"use strict";

import cp = require("child_process");
import { OutputChannel, window as Window, workspace as Workspace } from "vscode";
import { CommandContext, ensureAuth, selectDevice } from "./utils";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function currentFilePath(suffix: string): string {
  const editor = Window.activeTextEditor;
  if (!editor) throw new Error("No active file.");

  const filePath = editor.document.fileName;
  if (!filePath.endsWith(suffix)) throw new Error(`Non-'${suffix}'-file: ${filePath}.`);

  return filePath;
}

async function executeCommand(cmdContext: CommandContext, cmd: string, extension: string) {
  const toitExec : string = Workspace.getConfiguration("toit").get("Path", "toit");

  let filePath: string;
  try {
    filePath = currentFilePath(extension);
  } catch (e) {
    return Window.showErrorMessage(`Unable to ${cmd} file: ${e.message}`);
  }

  try {
    await ensureAuth(toitExec);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    const deviceName = await selectDevice(toitExec);

    const commandProcess = cp.spawn("toit", [ "dev", "-d", deviceName, cmd, filePath ]);
    const toitOutput: OutputChannel = cmdContext.outputChannel(deviceName);
    toitOutput.show();
    commandProcess.stdout.on("data", data => toitOutput.append(`${data}`));
    commandProcess.stderr.on("data", data => toitOutput.append(`${data}`));
  } catch (e) {
    Window.showErrorMessage(`${capitalize(cmd)} app failed: ${e.message}`);
  }
}

export function createRunCommand(cmdContext: CommandContext): () => void {
  return () => {
    executeCommand(cmdContext, "run", ".toit");
  };
}

export function createDeployCommand(cmdContext: CommandContext): () => void {
  return () => {
    executeCommand(cmdContext, "deploy", ".yaml");
  };
}
