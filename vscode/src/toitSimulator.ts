// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { promisify } from "util";
import { window as Window } from "vscode";
import { Device } from "./device";
import { Context, ensureAuth, selectDevice } from "./utils";
import cp = require("child_process");
const execFile = promisify(cp.execFile);

async function executeStopCommand(ctx: Context, device?: Device) {
  if (!await ensureAuth(ctx)) return;
  if (!device) device = await selectDevice(ctx, {"activeOnly": false, "simulatorOnly": true});

  if (!device) return;  // Device selection dismissed.

  if (!device.isSimulator) return Window.showErrorMessage("Non-simulator selected.");

  try {
    await execFile(ctx.toitExec, [ "simulator", "stop", device.deviceID ]);
    ctx.refreshDeviceView(device);
  } catch (e) {
    Window.showErrorMessage(`Stop simulator failed: ${e.message}`);
  }
}

export function createStopSimCommand(ctx: Context): () => void {
  return (dev?: Device) => {
    executeStopCommand(ctx, dev);
  };
}

async function executeStartCommand(ctx: Context) {
  if (!await ensureAuth(ctx)) return;
  const name = await Window.showInputBox({"title": "Simulator name", "prompt": "Enter simulator name. Leave empty for random name."});
  if (name === undefined) return;  // Name prompt was dismissed.

  try {
    const args = [ "simulator", "start" ];
    if (name) {
      args.push("--alias");
      args.push(name);
    }
    const { stdout, stderr } = await execFile(ctx.toitExec, args);
    ctx.toitOutput(stdout, stderr);

    ctx.refreshDeviceView();
  } catch (e) {
    Window.showErrorMessage(`Start simulator failed: ${e.message}`);
  }
}

export function createStartSimCommand(ctx: Context): () => void {
  return () => {
    executeStartCommand(ctx);
  };
}
