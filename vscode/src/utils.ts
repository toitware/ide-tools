"use strict";

import cp = require('child_process');
import { window as Window, InputBoxOptions } from "vscode";

function listDevices(toitExec: string): Promise<string[]> {
  const listDevicesCmd = toitExec + ' devices --active --names -o short';
  return new Promise((resolve, reject) => {
    cp.exec(listDevicesCmd, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        const deviceNames = stdout.split('\n');
        resolve(deviceNames);
      }
    });
  });
}

export async function selectDevice(toitExec: string): Promise<string> {
  const deviceNames = await listDevices(toitExec);
  const deviceName = await Window.showQuickPick(deviceNames);
  if (!deviceName) { throw new Error('No device selected.'); }
  return deviceName;
}

function login(toitExec: string, user: string, password: string): Promise<void> {
  const authLoginCmd = `${toitExec} auth login -u ${user} -p ${password}`;
  return new Promise((resolve, reject) =>
    cp.exec(authLoginCmd, (error, _stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      resolve();
    }));
}

function authInfo(toitExec: string): Promise<AuthInfo> {
  const authInfoCmd = `${toitExec} auth info -s -o json`;
  return new Promise((resolve, reject) => {
    cp.exec(authInfoCmd, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      const authInfo: AuthInfo = JSON.parse(stdout);
      resolve(authInfo);
    });
  });
}

interface AuthInfo {
  email?: string;
  id?: string;
  name?: string;
  organizationID?: string;
  organizationName?: string;
  status: string;
}


export async function ensureAuth(toitExec: string): Promise<void> {
  const info = await authInfo(toitExec);
  if (info.status === 'authenticated') {return;}

  const userPromptOptions: InputBoxOptions = {
    prompt: 'Enter your e-mail for toit.io',
  };
  const user = await Window.showInputBox(userPromptOptions);
  if (!user) { return new Promise((_resolve, reject) => reject('No e-mail provided')); }

  const passwordPromptOptions: InputBoxOptions = {
    prompt: `Enter your password for toit.io`,
    password: true
  };
  const password = await Window.showInputBox(passwordPromptOptions);
  if (!password) { return new Promise((_resolve, reject) => reject('No password provided')); }

  try {
    return await login(toitExec, user, password);
  } catch (e) {
    return new Promise((_resolve, reject) => reject(e.message));
  }
}

export function currentFilePath(suffix: string): string {
  const editor = Window.activeTextEditor;
  if (!editor) { throw new Error('No active file.'); }

  const filePath = editor.document.fileName;
  if (!filePath.endsWith(suffix)) { throw new Error(`Non-'${suffix}'-file: ${filePath}.`); }

  return filePath;
}
