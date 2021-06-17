// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { ExtensionContext, StatusBarAlignment, window as Window } from "vscode";
import { Context, ensureAuth, getFirmwareVersion, getOrganization, selectOrganization, setOrganization } from "./utils";

export async function activateToitStatusBar(ctx: Context, extensionContext: ExtensionContext): Promise<void> {
  const toitStatus = Window.createStatusBarItem(StatusBarAlignment.Left, 100);
  extensionContext.subscriptions.push(toitStatus);
  ctx.setStatusBar(toitStatus);
  updateStatus(ctx);
  toitStatus.command = "toit.setOrganization";
  toitStatus.show();
}

async function updateStatus(ctx: Context) {
  const toitStatus = ctx.getStatusBar();
  if (!toitStatus) return;
  const org = await getOrganization(ctx);
  const firmwareVersion = await getFirmwareVersion(ctx);
  toitStatus.text = `Toit: ${org} (${firmwareVersion})`;
}

async function executeCommand(ctx: Context) {
  try {
    await ensureAuth(ctx);
    const org = await selectOrganization(ctx);
    await setOrganization(ctx, org);
    await updateStatus(ctx);
    ctx.refreshDeviceView();
    ctx.refreshSerialView();
  } catch (e) {
    return Window.showErrorMessage(`Unable to change organization: ${e.message}.`)
  }
}

export function createSetOrgCommand(ctx: Context): () => void {
  return async() => executeCommand(ctx);
}
