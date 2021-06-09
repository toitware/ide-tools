import { ExtensionContext, StatusBarAlignment, window as Window } from "vscode";
import { CommandContext, ensureAuth, getFirmwareVersion, getOrganization, selectOrganization, setOrganization } from "./utils";

export async function activateToitStatusBar(ctx: CommandContext, extensionContext: ExtensionContext): Promise<void> {
  const toitStatus = Window.createStatusBarItem(StatusBarAlignment.Left, 100);
  extensionContext.subscriptions.push(toitStatus);
  ctx.setStatusBar(toitStatus);
  updateStatus(ctx);
  toitStatus.command = "toit.setOrganization";
  toitStatus.show();
}

async function updateStatus(ctx: CommandContext) {
  const toitStatus = ctx.getStatusBar();
  if (!toitStatus) return;
  const org = await getOrganization(ctx);
  const firmwareVersion = await getFirmwareVersion(ctx);
  toitStatus.text = `Toit: ${org} (${firmwareVersion})`;
}

async function executeCommand(ctx: CommandContext) {
  await ensureAuth(ctx);
  const org = await selectOrganization(ctx);
  await setOrganization(ctx, org);
  await updateStatus(ctx);
  ctx.refreshDeviceView();
}

export function createSetOrgCommand(ctx: CommandContext): () => void {
  return async() => executeCommand(ctx);
}
