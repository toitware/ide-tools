"use strict";

import cp = require('child_process');
import { workspace as Workspace, window as Window, OutputChannel } from "vscode";
import { filePath, ensure_auth, select_device } from "./utils";

async function deployCommand(toit_output: OutputChannel) {
  let toit_pwd : string = Workspace.getConfiguration('toit').get('Path','toit');

  let file_path: string
  try {
    file_path = filePath('.yaml');
  } catch (reason) {
    return Window.showErrorMessage(`Unable to deploy file: ${reason}`);
  }

  try {
    await ensure_auth(toit_pwd);
  } catch (reason) {
    return Window.showErrorMessage(`Login failed: ${reason}.`);
  }

  try {
    let device_name = await select_device(toit_pwd);

    let command_process = cp.spawn('toit',['dev','-d', device_name, 'deploy', file_path]);
    toit_output.show();
    command_process.stdout.on('data', data => toit_output.append(`${data}`));
    command_process.stderr.on('data', data => toit_output.append(`${data}`));
  } catch (reason) {
    Window.showErrorMessage(`Deploy app failed: ${reason}`)
  }
}

export function createDeployCommand(toit_output: OutputChannel) {
  return () => { deployCommand(toit_output) };
}
