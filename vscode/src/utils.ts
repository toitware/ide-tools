"use strict";

import { promisify } from "util";
import { InputBoxOptions, OutputChannel, QuickPickItem, Terminal, window as Window, workspace as Workspace } from "vscode";
import cp = require("child_process");
const execFile = promisify(cp.execFile);

export class CommandContext {
  lastSelectedDevice?: DeviceItem;
  lastSelectedPort?: string;
  toitExec : string = Workspace.getConfiguration("toit").get("Path", "toit");

  lastDevice(): DeviceItem | undefined {
    return this.lastSelectedDevice;
  }

  setLastDevice(device: DeviceItem): void {
    this.lastSelectedDevice = device;
  }

  lastPort(): string | undefined {
    return this.lastSelectedPort;
  }

  setLastPort(port: string): void {
    this.lastSelectedPort = port;
  }

  outputs: Map<string, OutputChannel> = new Map();

  outputChannel(id: string, name: string): OutputChannel {
    let output = this.outputs.get(id);
    if (output) return output;

    output = Window.createOutputChannel(`Toit (${name})`);
    this.outputs.set(id, output);
    return output;
  }

  serials: Map<string, Terminal> = new Map();

  serialTerminal(port: string): Terminal {
    let serial = this.serials.get(port);
    if (serial && !serial.exitStatus) return serial;

    serial = Window.createTerminal(`Toit serial (${port})`);
    this.serials.set(port, serial);
    return serial;
  }
}

export interface Device {
  // The JSON from console does not follow the naming-convention.
  /* eslint-disable @typescript-eslint/naming-convention */
  device_id: string;
  is_simulator: boolean;
  name: string;
  configure_firmware: string;
  last_seen: string;
  running_firmware: string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

class DeviceItem implements Device, QuickPickItem {
  // The JSON from console does not follow the naming-convention.
  /* eslint-disable @typescript-eslint/naming-convention */
  device_id: string;
  is_simulator: boolean;
  name: string;
  configure_firmware: string;
  last_seen: string;
  running_firmware: string;
  /* eslint-enable @typescript-eslint/naming-convention */
  label: string;

  constructor(device: Device) {
    this.device_id = device.device_id;
    this.is_simulator = device.is_simulator;
    this.name = device.name;
    this.configure_firmware = device.configure_firmware;
    this.last_seen = device.last_seen;
    this.running_firmware = device.running_firmware;
    this.label = this.name;
  }
}

export async function listDevices(ctx: CommandContext): Promise<DeviceItem[]> {
  const { stdout } = await execFile(ctx.toitExec, [ "devices", "--active", "--names", "-o", "json" ]);
  const devices = stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as Device).
    map(device => new DeviceItem(device));
  return devices;
}

function preferLastPicked(ctx: CommandContext, devices: DeviceItem[]) {
  const lastDevice = ctx.lastDevice();
  if (!lastDevice) return;

  const i = devices.findIndex(device => device.device_id === lastDevice.device_id);
  preferElement(i, devices);
}

export async function selectDevice(ctx: CommandContext): Promise<Device> {
  const deviceItems = await listDevices(ctx);
  preferLastPicked(ctx, deviceItems);
  const device = await Window.showQuickPick(deviceItems, { "placeHolder": "Pick a device" });
  if (!device) throw new Error("No device selected.");

  ctx.setLastDevice(device);
  return device;
}

async function login(ctx: CommandContext, user: string, password: string): Promise<void> {
  await execFile(ctx.toitExec, [ "auth", "login", "-u", user, "-p", password ]);
}

async function authInfo(ctx: CommandContext): Promise<AuthInfo> {
  const { stdout } = await execFile(ctx.toitExec, [ "auth", "info", "-s", "-o", "json" ]);
  return JSON.parse(stdout);
}

// Breaks naming convention to mimic console json format.
interface AuthInfo {
  // The JSON from console does not follow the naming-convention.
  /* eslint-disable @typescript-eslint/naming-convention */
  email?: string;
  id?: string;
  name?: string;
  organization_id?: string;
  organization_name?: string;
  status: string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

export async function isAuthenticated(ctx: CommandContext): Promise<boolean> {
  const info = await authInfo(ctx);
  return info.status === "authenticated";
}

async function consoleContext(ctx: CommandContext): Promise<string> {
  const { stdout } = await execFile(ctx.toitExec, [ "context", "default" ]);
  return stdout.trim();
}

export async function ensureAuth(ctx: CommandContext): Promise<void> {
  if (await consoleContext(ctx) === "local") return;

  if (await isAuthenticated(ctx)) return;

  const userPromptOptions: InputBoxOptions = {
    "prompt": "Enter your e-mail for toit.io"
  };
  const user = await Window.showInputBox(userPromptOptions);
  if (!user) throw new Error("No e-mail provided");

  const passwordPromptOptions: InputBoxOptions = {
    "prompt": "Enter your password for toit.io",
    "password": true
  };
  const password = await Window.showInputBox(passwordPromptOptions);
  if (!password) throw new Error("No password provided");

  return await login(ctx, user, password);
}

export interface WiFiInfo {
  ssid: string;
  password: string;
}

export async function promptForWiFiInfo(): Promise<WiFiInfo> {
  const ssidPromptOptions: InputBoxOptions = {
    "prompt": "Enter Wi-Fi SSID"
  };
  const ssid = await Window.showInputBox(ssidPromptOptions);
  if (!ssid) throw new Error("No Wi-Fi ssid provided");

  const passwordPromptOptions: InputBoxOptions = {
    "prompt": "Enter Wi-Fi password"
  };
  const password = await Window.showInputBox(passwordPromptOptions);
  if (!password) throw new Error("No Wi-Fi password provided");

  return { "ssid": ssid, "password": password};
}

export function currentFilePath(suffix: string): string {
  const editor = Window.activeTextEditor;
  if (!editor) throw new Error("No active file.");

  const filePath = editor.document.fileName;
  if (!filePath.endsWith(suffix)) throw new Error(`Non-'${suffix}'-file: ${filePath}.`);

  return filePath;
}

async function listPorts(ctx: CommandContext): Promise<string[]> {
  const { stdout } = await execFile(ctx.toitExec, ["serial", "ports"]);
  return stdout.split("\n").filter(str => str !== "");
}

export async function selectPort(ctx: CommandContext): Promise<string> {
  const ports = await listPorts(ctx);
  ports.reverse()

  const lastPort = ctx.lastPort();
  if (lastPort) {
    const i = ports.findIndex(port => port === lastPort);
    if (i > 0) preferElement(i, ports);
  }

  const port = await Window.showQuickPick(ports, { "placeHolder": "Pick a port" });
  if (!port) throw new Error("No port selected.");

  ctx.setLastPort(port);
  return port;
}

function preferElement<T>(index: number, list: T[]): void {
  if (index === 0) return;
  const preferred = list[index];
  list.splice(index, 1);
  list.unshift(preferred);
}
