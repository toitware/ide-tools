// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { InputBoxOptions, QuickPickItem, StatusBarItem, window as Window, workspace as Workspace } from "vscode";
import { App, ConsoleApp } from "./app";
import { toitExecFilePromise } from "./cli";
import { ConsoleDevice, ConsoleDeviceInfo, Device, DeviceInfo, RelatedDevice } from "./device";
import { ConsoleOrganization, Organization } from "./org";
import { updateStatus } from "./organization";
import { Output } from "./output";
import { ConsoleSerialInfo, SerialInfo, SerialPort } from "./serialPort";
import { Views } from "./views";

export class Context {
  statusBar?: StatusBarItem;
  lastSelectedDevice?: RelatedDevice;
  lastSelectedPort?: string;
  toitExec : string = getToitPath();
  lastFiles: Map<string, string> = new Map();
  output: Output;
  views: Views;
  cache: Cache;

  constructor() {
    this.output = new Output(this);
    this.views = new Views();
    this.cache = new Cache();
  }

  setStatusBar(sb: StatusBarItem): void {
    this.statusBar = sb;
  }

  getStatusBar(): StatusBarItem | undefined {
    return this.statusBar;
  }

}
class Cache {
  lastSelectedDevice?: RelatedDevice;
  lastSelectedPort?: string;

  lastDevice(): Device | undefined {
    return this.lastSelectedDevice?.device();
  }

  setLastDevice(device: RelatedDevice): void {
    this.lastSelectedDevice = device;
  }

  lastPort(): string | undefined {
    return this.lastSelectedPort;
  }

  setLastPort(port: string): void {
    this.lastSelectedPort = port;
  }
}


export async function listApps(ctx: Context, device: Device): Promise<App[]> {
  const { stdout } = await toitExecFilePromise(ctx, "dev", "-d", device.deviceID, "ps", "-o", "json");
  return stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleApp).
    map(app => new App(app, device));
}

export class DeviceItem implements QuickPickItem, RelatedDevice {
  dev: Device;
  label: string;

  constructor(device: ConsoleDevice) {
    this.dev = new Device(device);
    this.label = this.dev.name;
  }

  device(): Device {
    return this.dev;
  }
}

export async function listDevices(ctx: Context): Promise<DeviceItem[]> {
  const { stdout } = await toitExecFilePromise(ctx, "devices", "--names", "-o", "json" );
  return stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleDevice).
    map(device => new DeviceItem(device));
}

function preferLastPicked(ctx: Context, devices: DeviceItem[]) {
  const lastDevice = ctx.cache.lastDevice();
  if (!lastDevice) return;

  const i = devices.findIndex(item => item.device().deviceID === lastDevice.deviceID);
  preferElement(i, devices);
}

export interface SelectOptions {
  activeOnly: boolean;
  simulatorOnly: boolean;
}

export async function selectDevice(ctx: Context, config: SelectOptions): Promise<Device | undefined> {
  let deviceItems = await listDevices(ctx);
  if (config.activeOnly) deviceItems = deviceItems.filter(item => item.device().isActive);
  if (config.simulatorOnly) deviceItems = deviceItems.filter(item => item.device().isSimulator);
  preferLastPicked(ctx, deviceItems);
  const device = await Window.showQuickPick(deviceItems, { "placeHolder": "Pick a device" });
  if (!device) return undefined; // Device selection dismissed.

  ctx.cache.setLastDevice(device);
  return device.device();
}

export async function login(ctx: Context): Promise<boolean> {
  // TODO add timeout.
  await toitExecFilePromise(ctx, "auth", "login" );
  if (await isAuthenticated(ctx)) {
    ctx.views.refreshViews();
    updateStatus(ctx);
    return true;
  }
  return false;

}

async function authInfo(ctx: Context): Promise<AuthInfo> {
  const { stdout } = await toitExecFilePromise(ctx, "auth", "info", "-s", "-o", "json" );
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

export async function isAuthenticated(ctx: Context): Promise<boolean> {
  const info = await authInfo(ctx);
  return info.status === "authenticated";
}

async function consoleContext(ctx: Context): Promise<string> {
  const { stdout } = await toitExecFilePromise(ctx, "context", "default" );
  return stdout.trim();
}

export async function ensureAuth(ctx: Context): Promise<boolean> {
  if (await consoleContext(ctx) === "local") return true;

  if (await isAuthenticated(ctx)) return true;

  return await promptLogin(ctx);
}

async function promptLogin(ctx: Context): Promise<boolean> {
  const response = await Window.showWarningMessage("Authenticate with toit.io to use the Toit extension.", "Log in");
  if (response === "Log in") return await login(ctx);

  return false;
}

export interface WiFiInfo {
  ssid: string;
  password: string;
}

export async function promptForWiFiInfo(): Promise<WiFiInfo | undefined> {
  const ssidPromptOptions: InputBoxOptions = {
    "prompt": "Enter Wi-Fi SSID"
  };
  const ssid = await Window.showInputBox(ssidPromptOptions);
  if (!ssid) return undefined;

  const passwordPromptOptions: InputBoxOptions = {
    "prompt": "Enter Wi-Fi password"
  };
  const password = await Window.showInputBox(passwordPromptOptions);
  if (password === undefined) return undefined;

  return { "ssid": ssid, "password": password};
}

export function currentFilePath(suffix: string): string {
  const editor = Window.activeTextEditor;
  if (!editor) throw new Error("No active file.");

  const filePath = editor.document.fileName;
  if (!filePath.endsWith(suffix)) throw new Error(`Non-'${suffix}'-file: ${filePath}.`);

  return filePath;
}

export async function listPorts(ctx: Context): Promise<string[]> {
  const { stdout } = await toitExecFilePromise(ctx, "serial", "ports" );
  if (stdout.startsWith("No serial ports detected.")) return [];
  return stdout.split("\n").filter(str => str !== "");
}

export async function selectPort(ctx: Context): Promise<string | undefined> {
  const ports = await listPorts(ctx);
  ports.reverse();

  const lastPort = ctx.cache.lastPort();
  if (lastPort) {
    const i = ports.findIndex(port => port === lastPort);
    if (i > 0) preferElement(i, ports);
  }

  const port = await Window.showQuickPick(ports, { "placeHolder": "Pick a port" });
  if (!port) return undefined;

  ctx.cache.setLastPort(port);
  return port;
}

function preferElement<T>(index: number, list: T[]): void {
  if (index <= 0) return;
  const preferred = list[index];
  list.splice(index, 1);
  list.unshift(preferred);
}

export async function uninstallApp(ctx: Context, app: App): Promise<void> {
  await toitExecFilePromise(ctx, "dev", "-d", app.deviceID, "uninstall", app.jobID );
}

class OrganizationItem extends Organization implements QuickPickItem {
  label: string;

  constructor(org: ConsoleOrganization) {
    super(org);
    this.label = this.name;
  }
}

export async function getOrganization(ctx: Context): Promise<string | undefined> {
  if (!await isAuthenticated(ctx)) return undefined;
  const { stdout } = await toitExecFilePromise(ctx, "org", "get" );
  // The output of the command if of the form:
  // Logged in to Toitware
  // 01234567890123
  const orgStrOffset = 13;
  return stdout.slice(orgStrOffset).trimEnd();
}


async function listOrganizations(ctx: Context): Promise<OrganizationItem[]> {
  const { stdout } = await toitExecFilePromise(ctx, "org", "list", "-o", "json");
  return stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleOrganization).
    map(org => new OrganizationItem(org));
}

export async function selectOrganization(ctx: Context): Promise<Organization | undefined> {
  const organizations = await listOrganizations(ctx);
  return await Window.showQuickPick(organizations, { "placeHolder": "Pick an organization" });
}

export async function setOrganization(ctx: Context, org: Organization): Promise<void> {
  await toitExecFilePromise(ctx, "org", "use", org.organizationID);
}

export function getToitPath(): string {
  return Workspace.getConfiguration("toit").get("Path", "toit");
}

export async function getFirmwareVersion(ctx: Context): Promise<string | undefined> {
  if (!await isAuthenticated(ctx)) return undefined;
  const { stdout } = await toitExecFilePromise(ctx, "firmware", "version", "-o", "short" );
  return stdout.trimEnd();
}

export async function getSerialInfo(ctx: Context, port: SerialPort): Promise<SerialInfo | undefined> {
  try {
    const { stdout } = await toitExecFilePromise(ctx, "serial", "info", "--port", port.name );
    const serialInfo = JSON.parse(stdout) as ConsoleSerialInfo;
    const deviceInfo = await getDeviceInfo(ctx, serialInfo.hardware_id);
    return new SerialInfo(serialInfo, deviceInfo);
  } catch(e) {
    return undefined;
  }
}

export async function getDeviceInfo(ctx: Context, hwid: string): Promise<DeviceInfo | undefined> {
  try {
    const { stdout } = await toitExecFilePromise(ctx, "device", "info", "--hardware", hwid, "-o", "json");
    return new DeviceInfo(JSON.parse(stdout) as ConsoleDeviceInfo);
  } catch(e) {
    return undefined;
  }
}

export async function revealDevice(ctx: Context, hwid: string): Promise<void> {
  const deviceInfo = await getDeviceInfo(ctx, hwid);
  if (!deviceInfo) return; // TODO Add warning or error message?

  const device = await ctx.views.getDeviceProvider()?.getDevice(deviceInfo.deviceID);
  if (!device) {
    return; // TODO(Lau): Add warning or error message? Make sure to differentiate between hidden view and wrong org.
  }
  await ctx.views.getDeviceView()?.reveal(device, { "focus": true, "select": false, "expand": true });
}
