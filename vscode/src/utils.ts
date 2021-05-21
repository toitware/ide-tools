"use strict";

import { promisify } from "util";
import { InputBoxOptions, OutputChannel, window as Window } from "vscode";
import cp = require("child_process");
const execFile = promisify(cp.execFile);

export class CommandContext {
  outputs: Map<string, OutputChannel> = new Map();

  outputChannel(name: string): OutputChannel {
    let output = this.outputs.get(name);
    if (output) return output;

    output = Window.createOutputChannel(`Toit (${name})`);
    this.outputs.set(name, output);
    return output;
  }
}

async function listDevices (toitExec: string): Promise<string[]> {
  const { stdout } = await execFile(toitExec, [ "devices", "--active", "--names", "-o", "short" ]);
  return stdout.split("\n");
}

export async function selectDevice (toitExec: string): Promise<string> {
  const deviceNames = await listDevices(toitExec);
  const deviceName = await Window.showQuickPick(deviceNames);
  if (!deviceName) throw new Error("No device selected.");
  return deviceName;
}

async function login (toitExec: string, user: string, password: string): Promise<void> {
  await execFile(toitExec, [ "auth", "login", "-u", user, "-p", password ]);
}

async function authInfo (toitExec: string): Promise<AuthInfo> {
  const { stdout } = await execFile(toitExec, [ "auth", "info", "-s", "-o", "json" ]);
  return JSON.parse(stdout);
}

interface AuthInfo {
  email?: string;
  id?: string;
  name?: string;
  organizationID?: string;
  organizationName?: string;
  status: string;
}


export async function ensureAuth (toitExec: string): Promise<void> {
  const info = await authInfo(toitExec);
  if (info.status === "authenticated") return;

  const userPromptOptions: InputBoxOptions = {
    "prompt": "Enter your e-mail for toit.io"
  };
  const user = await Window.showInputBox(userPromptOptions);
  if (!user) throw new Error("No e-mail provided");

  const passwordPromptOptions: InputBoxOptions = {
    "prompt": `Enter your password for toit.io`,
    "password": true
  };
  const password = await Window.showInputBox(passwordPromptOptions);
  if (!password) throw new Error("No password provided");

  return await login(toitExec, user, password);
}

export function currentFilePath (suffix: string): string {
  const editor = Window.activeTextEditor;
  if (!editor) throw new Error("No active file.");

  const filePath = editor.document.fileName;
  if (!filePath.endsWith(suffix)) throw new Error(`Non-'${suffix}'-file: ${filePath}.`);

  return filePath;
}
