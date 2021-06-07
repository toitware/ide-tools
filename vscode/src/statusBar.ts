import { ExtensionContext, StatusBarAlignment, window as Window } from "vscode";
import { CommandContext, getOrganization } from "./utils";

export async function activateToitStatusBar(ctx: CommandContext, extensionContext: ExtensionContext) {
  let myStatusBarItem = Window.createStatusBarItem(StatusBarAlignment.Left, 100);
	extensionContext.subscriptions.push(myStatusBarItem);
  const org = await getOrganization(ctx);
  myStatusBarItem.text = `Toit: ${org}`;
  myStatusBarItem.show();
}
