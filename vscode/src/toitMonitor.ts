"use strict";

import { window as Window } from "vscode";
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
    terminal.sendText(`${ctx.toitExec} serial monitor --port '${port}'`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to monitor: ${e.message}`);
  }
}

export function createSerialMonitor(ctx: CommandContext): () => void {
  return () => serialMonitor(ctx);
}
