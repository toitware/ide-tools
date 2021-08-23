// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { basename } from "path";
import { window as Window } from "vscode";
import { toitExecFile, toitExecFilePromise } from "./cli";
import { Device } from "./device";
import { } from "./deviceView";
import { Context, ensureAuth, selectDevice } from "./utils";


function currentFilePath(suffix: string): string {
  const editor = Window.activeTextEditor;
  if (!editor) throw new Error("No active file.");

  const filePath = editor.document.fileName;
  if (!(filePath.endsWith(suffix))) {
    throw new Error(`In valid extension: ${filePath}.`);
  }
  return filePath;
}

async function executeRunCommand(ctx: Context, device?: Device) {
  let filePath: string;
  try {
    filePath = currentFilePath(".toit");
  } catch (e) {
    Window.showErrorMessage(`Unable to run or deploy: ${e}`);
    return;
  }

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
  let filePath: string;
  try {
    filePath = currentFilePath(".yaml");
  } catch (e) {
    Window.showErrorMessage(`Unable to deploy file: ${e}`);
    return;
  }

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
