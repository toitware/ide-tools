"use strict";

import cp = require("child_process");
import { window as Window, workspace as Workspace } from "vscode";
import { CommandContext, selectPort } from "./utils";

async function serialMonitor(ctx: CommandContext) {
  const toitExec : string = Workspace.getConfiguration("toit").get("Path", "toit");
  try {
    const port = await selectPort(toitExec);
    const terminal = ctx.serialTerminal(port);
    terminal.show();
    terminal.sendText(`${toitExec} serial monitor --port ${port} --model esp32-4mb`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to monitor: ${e.message}`);
  }
}

export function createSerialMonitor(ctx: CommandContext) {
  return () => serialMonitor(ctx);

}
