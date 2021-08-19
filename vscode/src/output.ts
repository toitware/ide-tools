import { OutputChannel, Terminal, window as Window } from "vscode";
import { toitExecFile } from "./cli";
import { Device } from "./device";
import { Context } from "./utils";
import cp = require("child_process");


export class Output {
  toitOut?: OutputChannel;
  logs: Map<string, DeviceLog> = new Map();
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

  startDeviceOutput(device: Device): void {
    if (!this.logs.has(device.deviceID)) this.logs.set(device.deviceID, new DeviceLog(this.context, device));
    const out = this.logs.get(device.deviceID);
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

export class DeviceLog {
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

    this.output = Window.createOutputChannel(`Toit logs (${this.device.name})`);
    this.output.show(true);
    this.childProcess = toitExecFile(this.context, "dev", "-d", this.device.deviceID, "logs" );
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
