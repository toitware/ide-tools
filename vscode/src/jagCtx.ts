// Copyright (C) 2022 Toitware ApS. All rights reserved.

import * as cp from "child_process";
import { promisify } from "util";
import { QuickPickItem, Terminal, window as Window } from "vscode";
import { preferElement } from "./utils";
const execFile = promisify(cp.execFile);

export class JagContext {
  watchNumber = 0;
  monitorNumber = 0;
  sharedTerminal: Terminal|null = null;
  jagExec: string;
  // Fix this any type before committing!
  lastDevice: any = null;

  constructor(jagExec: string) {
    this.jagExec = jagExec;
  }

  ensureSharedTerminal() : Terminal {
    if (!this.sharedTerminal || this.sharedTerminal.exitStatus) {
      this.sharedTerminal = Window.createTerminal(`jag`);
    }
    return this.sharedTerminal;
  }
}

export interface Device {
  id: string;
  name: string;
  address: string;
  wordSize: number;
}

class DeviceItem implements QuickPickItem {
  device: Device;
  label: string;

  constructor(device: Device) {
    this.device = device;
    this.label = this.device.name;
  }
}


export async function selectDevice(ctx: JagContext): Promise<Device | undefined> {
  const deviceItems = await listDeviceItems(ctx);
  preferLastPicked(ctx, deviceItems);
  const item = await Window.showQuickPick(deviceItems, { "placeHolder": "Pick a device" });
  if (!item) return undefined; // Device selection dismissed.

  ctx.lastDevice = item.device;
  return item.device;
}

function preferLastPicked(ctx: JagContext, devices: DeviceItem[]) {
  const lastDevice = ctx.lastDevice;
  if (!lastDevice) return;

  const i = devices.findIndex(item => item.device.id === lastDevice.id);
  preferElement(i, devices);
}

async function listDeviceItems(ctx: JagContext): Promise<DeviceItem[]> {
  const { stdout } = await jagExecFilePromise(ctx, "scan", "--list", "-o", "json" );
  const jsonResult = JSON.parse(stdout);
  return (jsonResult.devices as Device[]).map(dev => new DeviceItem(dev));
}

function jagExecFilePromise(ctx: JagContext, ...args: string[]): Promise<{stdout: string, stderr: string}> {
  return execFile(ctx.jagExec, args);
}
