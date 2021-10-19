// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { basename } from "path";
import { OpenDialogOptions, window as Window } from "vscode";
import { toitExecFile, toitExecFilePromise } from "./cli";
import { Device } from "./device";
import { } from "./deviceView";
import { Context, ensureAuth, selectDevice } from "./utils";


async function pickFile(dialogOptions: OpenDialogOptions): Promise<string | undefined> {
  const fileURI = await Window.showOpenDialog(dialogOptions);
  if (!fileURI) return;  // File selection prompt dismissed.

  return fileURI[0].fsPath;
}

async function getExecuteFilePath(suffix: string, dialogOptions: OpenDialogOptions): Promise<string | undefined> {
  const editor = Window.activeTextEditor;
  if (!editor) return await pickFile(dialogOptions);

  const filePath = editor.document.fileName;
  if (!(filePath.endsWith(suffix))) return await pickFile(dialogOptions);

  return filePath;
}

async function executeRunCommand(ctx: Context, device?: Device) {
  const filePath = await getExecuteFilePath(".toit", {
    "canSelectMany": false,
    "filters": {"Toit": ["toit"]},
    "title": "Select Toit-file to run"
  });

  if (!filePath) return;

  if (!await ensureAuth(ctx)) return;

  if (!device) device = await selectDevice(ctx, { "activeOnly": true, "simulatorOnly": false });

  if (!device) return;  // Device selection prompt dismissed.

  try {
    const out = ctx.output.deviceOutput(device);
    out.show();
    const cp = toitExecFile(ctx, "dev", "-d", device.name, "run", filePath);
    const fileName = basename(filePath);
    cp.stderr?.on("data", (message) => {
      out.send(fileName, message);
    });
    cp.stdout?.on("data", (message) => {
      out.send(fileName, message);
    });
  } catch (e) {
    Window.showErrorMessage(`Run app failed: ${e}`);
  }
}

async function executeDeployCommand(ctx: Context, device?: Device) {
  const filePath = await getExecuteFilePath(".yaml", {
    "canSelectMany": false,
    "filters": {"YAML": ["yaml"]},
    "title": "Select YAML-file to deploy"
  });
  if (!filePath) return;

  if (!await ensureAuth(ctx)) return;

  if (!device) device = await selectDevice(ctx, { "activeOnly": false, "simulatorOnly": false });

  if (!device) return;  // Device selection prompt dismissed.

  try {
    const fileName = basename(filePath);
    const out = ctx.output.deviceOutput(device);
    out.show();
    ctx.output.startDeviceOutput(device);
    const {stdout, stderr} = await toitExecFilePromise(ctx, "dev", "-d", device.name, "deploy", filePath );
    // We would like to only show out when there is an error and the device output otherwise.
    // However, with the current CLI (v.1.8.0) everything is dumped on stdout - even when things fail.
    if (stdout !== "") {
      out.send(fileName, stdout);
    }
    if (stderr !== "") {
      out.send(fileName, stderr);
    }
    ctx.views.refreshDeviceView(device);
  } catch (e) {
    Window.showErrorMessage(`Deploy app failed: ${e}`);
  }
}

export function createRunCommand(ctx: Context): () => void {
  return (device?: Device) => {
    executeRunCommand(ctx, device);
  };
}

export function createDeployCommand(ctx: Context): () => void {
  return (device?: Device) => {
    executeDeployCommand(ctx, device);
  };
}
