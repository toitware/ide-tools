import { OutputChannel, Terminal, window as Window } from "vscode";
import { toitExecFile } from "./cli";
import { Device } from "./device";
import { Context, ensureAuth, selectDevice } from "./utils";
import cp = require("child_process");


export class Output {
  toitOut?: OutputChannel;
  logs: Map<string, DeviceLog> = new Map();
  outputs: Map<string, DeviceOutput> = new Map();
  serials: Map<string, Terminal> = new Map();
  context: Context;

  constructor(ctx: Context) {
    this.context = ctx;
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

  deviceOutput(device: Device): DeviceOutput {
    let out = this.outputs.get(device.deviceID);
    if (out) return out;

    const outChannel = Window.createOutputChannel(`Toit output (${device.name})`);
    out = new DeviceOutput(outChannel);
    this.outputs.set(device.deviceID, out);
    return out;
  }

  startDeviceOutput(device: Device): void {
    if (!this.logs.has(device.deviceID)) this.logs.set(device.deviceID, new DeviceLog(this.context, device));
    const out = this.logs.get(device.deviceID);
    out?.start();
  }

  showDeviceOutput(device: Device): void {
    const out = this.logs.get(device.deviceID);
    out?.show();
  }

  serialTerminal(port: string): Terminal {
    let serial = this.serials.get(port);
    if (serial && !serial.exitStatus) return serial;

    serial = Window.createTerminal(`Toit serial (${port})`);
    this.serials.set(port, serial);
    return serial;
  }
}

export class DeviceOutput {
  output: OutputChannel;

  constructor(output: OutputChannel) {
    this.output = output;
  }

  show(): void {
    this.output.show(true);
  }

  send(sender: string, message: string): void {
    const lines = message.split("\n");
    if (message.endsWith("")) lines.pop();
    for (const line of lines) {
      this.output.appendLine(`[${sender}] ${line}`);
    }
  }
}

export class DeviceLog {
  context: Context;
  device: Device;
  childProcess?: cp.ChildProcess;
  output?: OutputChannel;

  constructor(ctx: Context, device: Device) {
    this.context = ctx;
    this.device = device;
  }

  show(): void {
    if (this.output) this.output.show(true);
  }

  start(): void {
    if (this.childProcess) {
      return;
    }

    this.output = Window.createOutputChannel(`Toit logs (${this.device.name})`);
    this.childProcess = toitExecFile(this.context, "dev", "-d", this.device.deviceID, "logs" );
    this.childProcess.stdout?.on("data", data => this.output?.append(data));
    this.childProcess.stderr?.on("data", data => this.output?.append(data));
  }

  stop(): void {
    if (this.childProcess?.kill()) this.childProcess = undefined;
  }

  dispose(): void {
    this.stop();
    this.output?.dispose();
    this.output = undefined;
  }
}

async function executeOutputCommand(ctx: Context, device?: Device) {

  if (!await ensureAuth(ctx)) return;

  if (!device) device = await selectDevice(ctx, { "activeOnly": false, "simulatorOnly": false });

  if (!device) return;  // Device selection prompt dismissed.

  ctx.output.startDeviceOutput(device);
  ctx.output.showDeviceOutput(device);
}

export function createOutputCommand(ctx: Context): () => void {
  return (device?: Device) => {
    executeOutputCommand(ctx, device);
  };
}
