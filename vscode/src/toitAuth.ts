"use strict";

import { window as Window } from "vscode";
import { CommandContext, ensureAuth } from "./utils";

async function ensureAuthCommand(cmdContext: CommandContext): Promise<void> {
  try {
    await ensureAuth(cmdContext);
  } catch(e) {
    Window.showErrorMessage(`Login to toit.io failed: ${e.message}.`);
    return;
  }
  Window.showInformationMessage(`Authenticated with toit.io.`);
}

export function createEnsureAuth(cmdContext: CommandContext): () => void {
  return () => ensureAuthCommand(cmdContext);
}
