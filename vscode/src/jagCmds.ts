// Copyright (C) 2021 Toitware ApS. All rights reserved.

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
  } catch (e) {
    return Window.showErrorMessage(`Unable to watch: ${e.message}`);
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
  } catch (e) {
    return Window.showErrorMessage(`Unable to watch: ${e.message}`);
  }
}

async function executeJagMonitor(ctx: JagContext) {
  try {
    const port = selectPort(ctx);
    if (!port) return;

    const terminal = Window.createTerminal(`jag monitor (${port})`);
    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} monitor --port '${port}'`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to monitor: ${e.message}`);
  }
}

function executeJagScan(ctx: JagContext) {
  try {
    const terminal = ctx.ensureSharedTerminal();

    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} scan`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to scan: ${e.message}`);
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

    const port = selectPort(ctx);
    if (!port) return;

    const terminal = ctx.ensureSharedTerminal();
    terminal.show(false);
    terminal.sendText(`${ctx.jagExec} flash --port '${port}' ${nameFlag} --wifi-ssid '${wifiInfo.ssid}' --wifi-password '${wifiInfo.password}'`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to flash: ${e.message}`);
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
