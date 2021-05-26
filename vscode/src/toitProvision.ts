"use strict";

import { window as Window } from "vscode";
import { CommandContext, ensureAuth, promptForWiFiInfo, selectPort, WiFiInfo } from "./utils";

async function serialMonitor(ctx: CommandContext) {
  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    const port = await selectPort(ctx);
    const wifiInfo: WiFiInfo = await promptForWiFiInfo();
    const terminal = ctx.serialTerminal(port);
    terminal.show();
    const provisionCmd = `${ctx.toitExec} serial provision --port ${port} --model esp32-4mb -p wifi.ssid="${wifiInfo.ssid}" -p wifi.password="${wifiInfo.password}"`;
    Window.showInformationMessage(provisionCmd);
    terminal.sendText(provisionCmd);
  } catch (e) {
    return Window.showErrorMessage(`Unable to monitor: ${e.message}`);
  }
}

export function createSerialProvision(ctx: CommandContext) {
  return () => serialMonitor(ctx);
}
