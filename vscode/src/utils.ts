// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { promisify } from "util";
import { InputBoxOptions, OutputChannel, QuickPickItem, StatusBarItem, Terminal, TreeItem, TreeView, window as Window, workspace as Workspace } from "vscode";
import { App, ConsoleApp } from "./app";
import { ConsoleDevice, ConsoleDeviceInfo, Device, DeviceInfo, RelatedDevice } from "./device";
import { DeviceProvider } from "./deviceView";
import { ConsoleOrganization, Organization } from "./org";
import { updateStatus } from "./organization";
import { ConsoleSerialInfo, SerialInfo, SerialPort } from "./serialPort";
import { SerialProvider } from "./serialView";
import cp = require("child_process");
const execFile = promisify(cp.execFile);

export class Context {
  statusBar?: StatusBarItem;
  deviceProvider?: DeviceProvider;
  deviceView?: TreeView<TreeItem>;
  serialProvider?: SerialProvider;
  lastSelectedDevice?: RelatedDevice;
  lastSelectedPort?: string;
  toitExec : string = getToitPath();
  toitOut?: OutputChannel;
  lastFiles: Map<string, string> = new Map();
  outputs: Map<string, DeviceOutput> = new Map();
  serials: Map<string, Terminal> = new Map();

  getDeviceView(): TreeView<TreeItem> | undefined {
    return this.deviceView;
  }

  setDeviceView(deviceView: TreeView<TreeItem>): void {
    this.deviceView = deviceView;
  }

  setStatusBar(sb: StatusBarItem): void {
    this.statusBar = sb;
  }

  getStatusBar(): StatusBarItem | undefined {
    return this.statusBar;
  }

  setLastFile(extension: string, path: string): void {
    this.lastFiles.set(extension, path);
  }

  getLastFile(extension: string): string | undefined {
    return this.lastFiles.get(extension);
  }

  getDeviceProvider(): DeviceProvider | undefined {
    return this.deviceProvider;
  }

  setDeviceProvider(provider: DeviceProvider) : void {
    this.deviceProvider = provider;
  }

  setSerialProvider(provider: SerialProvider) : void {
    this.serialProvider = provider;
  }

  refreshViews(): void {
    this.refreshSerialView();
    this.refreshDeviceView();
  }

  refreshDeviceView(data?: TreeItem) : void {
    this.deviceProvider?.refresh(data);
  }

  refreshSerialView(data?: TreeItem) : void {
    this.serialProvider?.refresh(data);
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

  toitOutputChannel(): OutputChannel {
    if (!this.toitOut) this.toitOut = Window.createOutputChannel("Toit");

    return this.toitOut as OutputChannel;
  }

  toitOutput(...lines: string[]): void {
    const out = this.toitOutputChannel();
    out.show(true);
    lines.forEach(line => out.append(line));
  }

  startDeviceOutput(device: Device): void {
    if (!this.outputs.has(device.deviceID)) this.outputs.set(device.deviceID, new DeviceOutput(this, device));
    const out = this.outputs.get(device.deviceID);
    out?.start();
  }

  serialTerminal(port: string): Terminal {
    let serial = this.serials.get(port);
    if (serial && !serial.exitStatus) return serial;

    serial = Window.createTerminal(`Toit serial (${port})`);
    this.serials.set(port, serial);
    return serial;
  }
}

class DeviceOutput {
  context: Context;
  device: Device;
  childProcess?: cp.ChildProcess;
  output?: OutputChannel;

  constructor(ctx: Context, device: Device) {
    this.context = ctx;
    this.device = device;
  }

  start() {
    if (this.childProcess) {
      if (this.output) this.output.show(true);
      return;
    }

    this.output = Window.createOutputChannel(`Toit (${this.device.name})`);
    this.output.show(true);
    this.childProcess = cp.execFile(this.context.toitExec, [ "dev", "-d", this.device.deviceID, "logs" ]);
    this.childProcess.stdout?.on("data", data => this.output?.append(data));
    this.childProcess.stderr?.on("data", data => this.output?.append(data));
  }

  stop() {
    if (this.childProcess?.kill()) this.childProcess = undefined;
  }

  dispose() {
    this.stop();
    this.output?.dispose();
    this.output = undefined;
  }
}

export async function listApps(ctx: Context, device: Device): Promise<App[]> {
  // TODO(Lau): change this when is_active is part of json.
  const cmdArgs =  [ "dev", "-d", device.deviceID, "ps", "-o", "json" ];
  const { stdout } = await execFile(ctx.toitExec, cmdArgs);
  return stdout.split("\n").
    filter(str => str !== "").
    map(json => JSON.parse(json) as ConsoleApp).
    map(app => new App(app, device));
}

class DeviceItem implements QuickPickItem, RelatedDevice {
  dev: Device;
  label: string;

  constructor(device: ConsoleDevice, active: boolean) {
    this.dev = new Device(device, active);
    this.label = this.dev.name;
  }

  device(): Device {
    return this.dev;
  }
}

export async function listDevices(ctx: Context): Promise<DeviceItem[]> {
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
    map(device => new DeviceItem(device, !!activeDevices.find(o => o.device_id === device.device_id)));
  return allDevices;
}

function preferLastPicked(ctx: Context, devices: DeviceItem[]) {
  const lastDevice = ctx.lastDevice();
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

  ctx.setLastDevice(device);
  return device.device();
}

export async function login(ctx: Context): Promise<boolean> {
  // TODO add timeout.
  await execFile(ctx.toitExec, [ "auth", "login" ]);
  if (await isAuthenticated(ctx)) {
    ctx.refreshViews();
    updateStatus(ctx);
    return true;
  }
  return false;

}

async function authInfo(ctx: Context): Promise<AuthInfo> {
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

export async function isAuthenticated(ctx: Context): Promise<boolean> {
  const info = await authInfo(ctx);
  return info.status === "authenticated";
}

async function consoleContext(ctx: Context): Promise<string> {
  const { stdout } = await execFile(ctx.toitExec, [ "context", "default" ]);
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
  const { stdout } = await execFile(ctx.toitExec, [ "serial", "ports" ]);
  if (stdout.startsWith("No serial ports detected.")) return [];
  return stdout.split("\n").filter(str => str !== "");
}

export async function selectPort(ctx: Context): Promise<string | undefined> {
  const ports = await listPorts(ctx);
  ports.reverse();

  const lastPort = ctx.lastPort();
  if (lastPort) {
    const i = ports.findIndex(port => port === lastPort);
    if (i > 0) preferElement(i, ports);
  }

  const port = await Window.showQuickPick(ports, { "placeHolder": "Pick a port" });
  if (!port) return undefined;

  ctx.setLastPort(port);
  return port;
}

function preferElement<T>(index: number, list: T[]): void {
  if (index <= 0) return;
  const preferred = list[index];
  list.splice(index, 1);
  list.unshift(preferred);
}

export async function uninstallApp(ctx: Context, app: App): Promise<void> {
  await execFile(ctx.toitExec, [ "dev", "-d", app.deviceID, "uninstall", app.jobID ]);
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
  const { stdout } = await execFile(ctx.toitExec, [ "org", "get" ]);
  // The output of the command if of the form:
  // Logged in to Toitware
  // 01234567890123
  const orgStrOffset = 13;
  return stdout.slice(orgStrOffset).trimEnd();
}


async function listOrganizations(ctx: Context): Promise<OrganizationItem[]> {
  // TODO(Lau): change this when is_active is part of json.
  const cmdArgs =  [ "org", "list", "-o", "json" ];
  const { stdout } = await execFile(ctx.toitExec, cmdArgs);
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
  const cmdArgs =  [ "org", "use", org.organizationID ];
  await execFile(ctx.toitExec, cmdArgs);
}

export function getToitPath(): string {
  return Workspace.getConfiguration("toit").get("Path", "toit");
}

export async function getFirmwareVersion(ctx: Context): Promise<string | undefined> {
  if (!await isAuthenticated(ctx)) return undefined;
  const { stdout } = await execFile(ctx.toitExec, [ "firmware", "version", "-o", "short" ]);
  return stdout.trimEnd();
}

export async function getSerialInfo(ctx: Context, port: SerialPort): Promise<SerialInfo | undefined> {
  const cmdArgs =  [ "serial", "info", "--port", port.name ];
  try {
    const { stdout } = await execFile(ctx.toitExec, cmdArgs);
    const serialInfo = JSON.parse(stdout) as ConsoleSerialInfo;
    const deviceInfo = await getDeviceInfo(ctx, serialInfo.hardware_id);
    return new SerialInfo(serialInfo, deviceInfo);
  } catch(e) {
    return undefined;
  }
}

export async function getDeviceInfo(ctx: Context, hwid: string): Promise<DeviceInfo | undefined> {
  const cmdArgs =  [ "device", "info", "--hardware", hwid, "-o", "json" ];
  try {
    const { stdout } = await execFile(ctx.toitExec, cmdArgs);
    return new DeviceInfo(JSON.parse(stdout) as ConsoleDeviceInfo);
  } catch(e) {
    return undefined;
  }
}

export async function revealDevice(ctx: Context, hwid: string): Promise<void> {
  const deviceInfo = await getDeviceInfo(ctx, hwid);
  if (!deviceInfo) return; // TODO Add warning or error message?

  const device = await ctx.getDeviceProvider()?.getDevice(deviceInfo.deviceID);
  if (!device) {
    return; // TODO(Lau): Add warning or error message? Make sure to differentiate between hidden view and wrong org.
  }
  await (await ctx.getDeviceView())?.reveal(device, { "focus": true, "select": false, "expand": true });
}
