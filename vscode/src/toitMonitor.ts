"use strict";

import cp = require("child_process");
import { window as Window, workspace as Workspace } from "vscode";
import { CommandContext, ensureAuth, selectPort } from "./utils";

async function serialMonitor(ctx: CommandContext) {
  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    const port = await selectPort(ctx);
    const terminal = ctx.serialTerminal(port);
    terminal.show();
    terminal.sendText(`${ctx.toitExec} serial monitor --port ${port} --model esp32-4mb`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to monitor: ${e.message}`);
  }
}

export function createSerialMonitor(ctx: CommandContext) {
  return () => serialMonitor(ctx);

}
