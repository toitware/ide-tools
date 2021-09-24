// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { ExtensionContext, StatusBarAlignment, window as Window } from "vscode";
import { Context, ensureAuth, getFirmwareVersion, getProject, isAuthenticated, selectProject, setProject } from "./utils";

export async function activateToitStatusBar(ctx: Context, extensionContext: ExtensionContext): Promise<void> {
  const toitStatus = Window.createStatusBarItem(StatusBarAlignment.Left, 100);
  extensionContext.subscriptions.push(toitStatus);
  ctx.setStatusBar(toitStatus);
  updateStatus(ctx);
  toitStatus.command = "toit.setProject";
  toitStatus.show();
}

export async function updateStatus(ctx: Context): Promise<void> {
  if (!await isAuthenticated(ctx)) return;
  const toitStatus = ctx.getStatusBar();
  if (!toitStatus) return;
  const project = await getProject(ctx);
  const firmwareVersion = await getFirmwareVersion(ctx);
  toitStatus.text = `Toit: ${project} (${firmwareVersion})`;
}

async function executeCommand(ctx: Context) {
  if (!await ensureAuth(ctx)) return;

  const project = await selectProject(ctx);
  if (project === undefined) return;

  try {
    await setProject(ctx, project);
    await updateStatus(ctx);
    ctx.views.refreshViews();
  } catch (e) {
    return Window.showErrorMessage(`Unable to change project: ${e.message}.`);
  }
}

export function createSetProjectCommand(ctx: Context): () => void {
  return async() => executeCommand(ctx);
}
