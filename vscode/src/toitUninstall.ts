"use strict";

import cp = require("child_process");
import { App, RelatedApp } from "./app";
import { CommandContext, uninstallApp } from "./utils";

export function createUninstallCommand(cmdContext: CommandContext): (app: App) => void {
  return async (app: RelatedApp) => {
    await uninstallApp(app.app());
    cmdContext.refreshDeviceView();
  };
}
