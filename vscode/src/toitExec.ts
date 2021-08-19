// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { window as Window } from "vscode";
import { toitExecFilePromise, toitSpawn } from "./cli";
import { Device } from "./device";
import { } from "./deviceView";
import { Context, ensureAuth, selectDevice } from "./utils";


function currentFilePath(ctx: Context, suffix: string): string {
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

async function executeRunCommand(ctx: Context, device?: Device) {
  let filePath: string;
  try {
    filePath = currentFilePath(ctx, ".toit");
  } catch (e) {
    return Window.showErrorMessage(`Unable to run file: ${e.message}`);
  }

  if (!await ensureAuth(ctx)) return;

  if (!device) device = await selectDevice(ctx, { "activeOnly": true, "simulatorOnly": false });

  if (!device) return;  // Device selection prompt dismissed.

  try {
    ctx.output.startDeviceOutput(device);
    toitSpawn(ctx, "dev", "-d", device.name, "run", filePath);
    ctx.setLastFile(".toit", filePath);
  } catch (e) {
    Window.showErrorMessage(`Run app failed: ${e.message}`);
  }
}

async function executeDeployCommand(ctx: Context, device?: Device) {
  let filePath: string;
  try {
    filePath = currentFilePath(ctx, ".yaml");
  } catch (e) {
    return Window.showErrorMessage(`Unable to deploy file: ${e.message}`);
  }

  if (!await ensureAuth(ctx)) return;

  if (!device) device = await selectDevice(ctx, { "activeOnly": false, "simulatorOnly": false });

  if (!device) return;  // Device selection prompt dismissed.

  try {
    ctx.output.startDeviceOutput(device);
    await toitExecFilePromise(ctx, "dev", "-d", device.name, "deploy", filePath );
    ctx.views.refreshDeviceView(device);
    ctx.setLastFile(".yaml", filePath);
  } catch (e) {
    Window.showErrorMessage(`Deploy app failed: ${e.message}`);
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
