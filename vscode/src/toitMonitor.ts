// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { window as Window } from "vscode";
import { SerialPort } from "./serialPort";
import { Context, ensureAuth, selectPort } from "./utils";

async function serialMonitor(ctx: Context, serialPort?: SerialPort) {
  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    const port = serialPort ? serialPort.name : await selectPort(ctx);
    const terminal = ctx.serialTerminal(port);
    terminal.show();
    terminal.sendText(`${ctx.toitExec} serial monitor --port '${port}'`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to monitor: ${e.message}`);
  }
}

export function createSerialMonitor(ctx: Context): () => void {
  return (port?: SerialPort) => serialMonitor(ctx, port);
}
