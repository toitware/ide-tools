// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { window as Window } from "vscode";
import { Context, ensureAuth, promptForWiFiInfo, selectPort, WiFiInfo } from "./utils";

async function serialMonitor(ctx: Context) {
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
    const provisionCmd = `${ctx.toitExec} serial provision --port ${port} --model esp32-4mb -p wifi.ssid='${wifiInfo.ssid}' -p wifi.password='${wifiInfo.password}'`;
    terminal.sendText(provisionCmd);
  } catch (e) {
    return Window.showErrorMessage(`Unable to provision: ${e.message}`);
  }
}

export function createSerialProvision(ctx: Context): () => void {
  return () => serialMonitor(ctx);
}
