"use strict";

import { promisify } from "util";
import { InputBoxOptions, OutputChannel, QuickPickItem, StatusBarItem, Terminal, window as Window, workspace as Workspace } from "vscode";
import { App, ConsoleApp } from "./app";
import { ConsoleDevice, Device, RelatedDevice } from "./device";
import { ConsoleOrganization, Organization } from "./org";
import { ToitDataProvider } from "./treeView";
import cp = require("child_process");
const execFile = promisify(cp.execFile);

export class CommandContext {
  statusBar?: StatusBarItem;
  deviceViewProvider?: ToitDataProvider;
  lastSelectedDevice?: RelatedDevice;
  lastSelectedPort?: string;
  lastFiles: Map<string, string> = new Map();
  toitExec : string = getToitPath();

  setStatusBar(sb: StatusBarItem) {
    this.statusBar = sb;
  }

  getStatusBar(): StatusBarItem | undefined {
    return this.statusBar;
  }

  setLastFile(extension: string, path: string) {
    this.lastFiles.set(extension, path);
  }

  getLastFile(extension: string): string | undefined {
    return this.lastFiles.get(extension);
  }

  setDeviceProvider(provider: ToitDataProvider) : void {
    this.deviceViewProvider = provider;
  }

  refreshDeviceView() : void {
    if (this.deviceViewProvider) this.deviceViewProvider.refresh();
  }

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

export async function listApps(ctx: CommandContext, device: Device): Promise<App[]> {
  // TODO(Lau): change this when is_active is part of json.
  const cmdArgs =  [ "dev", "-d", device.deviceID, "ps", "-o", "json"];
  const { stdout } = await execFile(ctx.toitExec, cmdArgs);
  return stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleApp).
    map(app => new App(app));
}

class DeviceItem extends Device implements QuickPickItem {
  label: string;

  constructor(device: ConsoleDevice, active: boolean) {
    super(device, active);
    this.label = device.name;
  }
}

export async function listDevices(ctx: CommandContext): Promise<DeviceItem[]> {
  // TODO(Lau): change this when is_active is part of json.
  const cmdArgs =  [ "devices", "--names", "-o", "json" ];
  const jsonAll = await execFile(ctx.toitExec, cmdArgs);
  cmdArgs.push("--active");
  const jsonActive = await execFile(ctx.toitExec, cmdArgs);

  const activeDevices = jsonActive.stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleDevice);

  const allDevices = jsonAll.stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleDevice).
    map(device => new DeviceItem(device, activeDevices.find(o => o.device_id == device.device_id) ? true : false));
  return allDevices;
}

function preferLastPicked(ctx: CommandContext, devices: DeviceItem[]) {
  const lastDevice = ctx.lastDevice();
  if (!lastDevice) return;

  const i = devices.findIndex(device => device.deviceID === lastDevice.deviceID);
  preferElement(i, devices);
}

export async function selectDevice(ctx: CommandContext, activeOnly: boolean): Promise<Device> {
  let deviceItems = await listDevices(ctx);
  if (activeOnly) deviceItems = deviceItems.filter(device => device.isActive);
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

  await login(ctx, user, password);
  ctx.refreshDeviceView();
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
  const { stdout } = await execFile(ctx.toitExec, [ "serial", "ports" ]);
  return stdout.split("\n").filter(str => str !== "");
}

export async function selectPort(ctx: CommandContext): Promise<string> {
  const ports = await listPorts(ctx);
  ports.reverse();

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
  if (index <= 0) return;
  const preferred = list[index];
  list.splice(index, 1);
  list.unshift(preferred);
}

export async function uninstallApp(ctx: CommandContext, app: App) {
  await execFile(ctx.toitExec, [ "dev", "-d", app.deviceID, "uninstall", app.jobID ]);
}

class OrganizationItem extends Organization implements QuickPickItem {
  label: string;

  constructor(org: ConsoleOrganization) {
    super(org);
    this.label = this.name;
  }
}

export async function getOrganization(ctx: CommandContext) {
  await ensureAuth(ctx);
  const { stdout } = await execFile(ctx.toitExec, [ "org", "get" ]);
  return stdout.slice(13);
}


async function listOrganizations(ctx: CommandContext): Promise<OrganizationItem[]> {
  // TODO(Lau): change this when is_active is part of json.
  const cmdArgs =  [ "org", "list", "-o", "json"];
  const { stdout } = await execFile(ctx.toitExec, cmdArgs);
  return stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleOrganization).
    map(org => new OrganizationItem(org));
}

export async function selectOrganization(ctx: CommandContext): Promise<Organization> {
  let organizations = await listOrganizations(ctx);
  const org = await Window.showQuickPick(organizations, { "placeHolder": "Pick an organization" });
  if (!org) throw new Error("No organization selected.");
  return org;
}

export async function setOrganization(ctx: CommandContext, org: Organization) {
  const cmdArgs =  [ "org", "use", org.organizationID];
  await execFile(ctx.toitExec, cmdArgs);

export function getToitPath(): string {
  return Workspace.getConfiguration("toit").get("Path", "toit");

}
