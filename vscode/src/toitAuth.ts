// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { window as Window } from "vscode";
import { Context, ensureAuth } from "./utils";

async function ensureAuthCommand(ctx: Context): Promise<void> {
  if (await ensureAuth(ctx)) {
    Window.showInformationMessage("Authenticated with toit.io.");
  } else {
    Window.showErrorMessage("Login to toit.io failed.");
  }
}

export function createEnsureAuth(ctx: Context): () => void {
  return () => ensureAuthCommand(ctx);
}
