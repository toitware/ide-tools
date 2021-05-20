"use strict";

import cp = require('child_process');
import { workspace as Workspace, window as Window, OutputChannel } from "vscode";
import { ensure_auth, select_device} from "./utils";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function filePath(suffix: string): string {
  let editor = Window.activeTextEditor;
  if (!editor) throw 'No active file.';

  let file_path = editor.document.fileName;
  if (!file_path.endsWith(suffix)) throw `Non-'${suffix}'-file: ${file_path}.`;

  return file_path;
}

async function executeCommand(toit_output: OutputChannel, cmd: string, extension: string) {
  let toit_pwd : string = Workspace.getConfiguration('toit').get('Path','toit');

  let file_path: string
  try {
    file_path = filePath(extension);
  } catch (reason) {
    return Window.showErrorMessage(`Unable to ${cmd} file: ${reason}`);
  }

  try {
    await ensure_auth(toit_pwd);
  } catch (reason) {
    return Window.showErrorMessage(`Login failed: ${reason}.`);
  }

  try {
    let device_name = await select_device(toit_pwd);

    let command_process = cp.spawn('toit',['dev','-d', device_name, cmd, file_path]);
    toit_output.show();
    command_process.stdout.on('data', data => toit_output.append(`${data}`));
    command_process.stderr.on('data', data => toit_output.append(`${data}`));
  } catch (reason) {
    Window.showErrorMessage(`${capitalize(cmd)} app failed: ${reason}`)
  }
}

export function createRunCommand(toit_output: OutputChannel) {
  return () => { executeCommand(toit_output, 'run', '.toit') };
}

export function createDeployCommand(toit_output: OutputChannel) {
  return () => { executeCommand(toit_output, 'deploy', '.yaml') };
}
