// Copyright (C) 2022 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

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
  lastDevice: Device | null = null;
  lastPort: string | null = null;
  portTerminals: Map<string, Terminal> = new Map();

  constructor(jagExec: string) {
    this.jagExec = jagExec;
  }

  ensureSharedTerminal() : Terminal {
    if (!this.sharedTerminal || this.sharedTerminal.exitStatus) {
      this.sharedTerminal = Window.createTerminal(`jag`);
    }
    return this.sharedTerminal;
  }

  portTerminal(port: string) : Terminal {
    let serial = this.portTerminals.get(port);
    if (serial && !serial.exitStatus) return serial;

    serial = Window.createTerminal(`Toit serial (${port})`);
    this.portTerminals.set(port, serial);

    return serial;
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
  const { stdout } = await jagExecFilePromise(ctx, "scan", "--list", "--output", "json" );
  const jsonResult = JSON.parse(stdout);
  return (jsonResult.devices as Device[]).map(dev => new DeviceItem(dev));
}

export async function selectPort(ctx: JagContext): Promise<string | undefined> {
  const ports = await listPorts(ctx);

  const lastPort = ctx.lastPort;
  if (lastPort) {
    const i = ports.findIndex(port => port === lastPort);
    if (i > 0) preferElement(i, ports);
  }

  const port = await Window.showQuickPick(ports, { "placeHolder": "Pick a port" });
  if (!port) return undefined;

  ctx.lastPort = port;
  return port;
}

async function listPorts(ctx: JagContext): Promise<string[]> {
  const { stdout } = await jagExecFilePromise(ctx, "port", "--list", "--output", "json" );
  const jsonResult = JSON.parse(stdout);
  if (!jsonResult.ports) return [];

  return jsonResult.ports as string[];
}


function jagExecFilePromise(ctx: JagContext, ...args: string[]): Promise<{stdout: string, stderr: string}> {
  return execFile(ctx.jagExec, args);
}
