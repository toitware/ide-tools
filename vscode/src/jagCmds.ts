// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { InputBoxOptions, window as Window } from "vscode";
import { JagContext, selectDevice, selectPort } from "./jagCtx";
import { getExecuteFilePath, promptForWiFiInfo } from "./utils";


async function executeJagWatch(ctx: JagContext) {
  try {
    const filePath = await getExecuteFilePath(".toit", {
      "canSelectMany": false,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "filters": {"Toit": ["toit"]},
      "title": "Select Toit-file to watch"
    });

    if (!filePath) return;

    const device = await selectDevice(ctx);
    if (!device) return;

    const prefix = ctx.watchNumber === 0 ? "" : ` (${ctx.watchNumber++})`;
    const terminal = Window.createTerminal(`jag watch${prefix}`);
    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} watch ${filePath} --device ${device.id}`);
  } catch (e: unknown) {
    const errorMessage = (e instanceof Error) ? e.message : String(e);
    return Window.showErrorMessage(`Unable to watch: ${errorMessage}`);
  }
}

async function executeJagRun(ctx: JagContext) {
  try {
    const filePath = await getExecuteFilePath(".toit", {
      "canSelectMany": false,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "filters": {"Toit": ["toit"]},
      "title": "Select Toit-file to run"
    });

    if (!filePath) return;

    const device = await selectDevice(ctx);
    if (!device) return;

    const terminal = ctx.ensureSharedTerminal();
    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} run ${filePath} --device ${device.id}`);
  } catch (e: unknown) {
    const errorMessage = (e instanceof Error) ? e.message : String(e);
    return Window.showErrorMessage(`Unable to run: ${errorMessage}`);
  }
}

async function executeJagMonitor(ctx: JagContext) {
  try {
    const port = await selectPort(ctx);
    if (!port) return;

    const terminal = ctx.portTerminal(port);
    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} monitor --port '${port}'`);
  } catch (e: unknown) {
    const errorMessage = (e instanceof Error) ? e.message : String(e);
    return Window.showErrorMessage(`Unable to monitor: ${errorMessage}`);
  }
}

function executeJagScan(ctx: JagContext) {
  try {
    const terminal = ctx.ensureSharedTerminal();

    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} scan`);
  } catch (e: unknown) {
    const errorMessage = (e instanceof Error) ? e.message : String(e);
    return Window.showErrorMessage(`Unable to scan: ${errorMessage}`);
  }
}

async function executeJagFlash(ctx: JagContext) {
  try {
    const wifiInfo = await promptForWiFiInfo();

    if (!wifiInfo) return;

    const namePromptOptions: InputBoxOptions = {
      "prompt": "Enter device name (optional)"
    };
    const name = await Window.showInputBox(namePromptOptions);
    const nameFlag = name ? `--name '${name}'`: "";

    const port = await selectPort(ctx);
    if (!port) return;

    const terminal = ctx.portTerminal(port);
    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} flash --port '${port}' ${nameFlag} --wifi-ssid '${wifiInfo.ssid}' --wifi-password '${wifiInfo.password}'`);
  } catch (e: unknown) {
    const errorMessage = (e instanceof Error) ? e.message : String(e);
    return Window.showErrorMessage(`Unable to flash: ${errorMessage}`);
  }
}

export function createJagWatchCommand(ctx: JagContext): () => void {
  return () => {
    executeJagWatch(ctx);
  };
}

export function createJagRunCommand(ctx: JagContext): () => void {
  return () => {
    executeJagRun(ctx);
  };
}

export function createJagMonitorCommand(ctx: JagContext): () => void {
  return () => {
    executeJagMonitor(ctx);
  };
}

export function createJagScanCommand(ctx: JagContext): () => void {
  return () => {
    executeJagScan(ctx);
  };
}

export function createJagFlashCommand(ctx: JagContext): () => void {
  return () => {
    executeJagFlash(ctx);
  };
}
