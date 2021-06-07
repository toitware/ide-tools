"use strict";

import { window as Window } from "vscode";
import { CommandContext, ensureAuth, ensurePath, selectPort } from "./utils";

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
    terminal.sendText(`${ensurePath()} serial monitor --port '${port}' --model esp32-4mb`);
  } catch (e) {
    return Window.showErrorMessage(`Unable to monitor: ${e.message}`);
  }
}

export function createSerialMonitor(ctx: CommandContext): () => void {
  return () => serialMonitor(ctx);
}
