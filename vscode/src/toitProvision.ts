// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { window as Window } from "vscode";
import { SerialPort } from "./serialPort";
import { Context, ensureAuth, promptForWiFiInfo, selectPort } from "./utils";

async function serialMonitor(ctx: Context, serialPort?: SerialPort) {
  if (!await ensureAuth(ctx)) return;

  const port = serialPort ? SerialPort.name : await selectPort(ctx);
  if (port === undefined) return;  // Port selection prompt dismissed.

  const wifiInfo = await promptForWiFiInfo();
  if (!wifiInfo) return;  // WiFi dialog dismissed.

  try {
    const terminal = ctx.serialTerminal(port);
    terminal.show(true);
    const provisionCmd = `${ctx.toitExec} serial provision --port ${port} --model esp32-4mb -p wifi.ssid='${wifiInfo.ssid}' -p wifi.password='${wifiInfo.password}'`;
    terminal.sendText(provisionCmd);
  } catch (e) {
    return Window.showErrorMessage(`Unable to provision: ${e.message}`);
  }
}

export function createSerialProvision(ctx: Context): () => void {
  return (port?: SerialPort) => serialMonitor(ctx, port);
}
