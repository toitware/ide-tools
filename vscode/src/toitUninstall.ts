"use strict";

import cp = require("child_process");
import { App, RelatedApp } from "./app";
import { ToitDataProvider } from "./treeView";
import { CommandContext, uninstallApp } from "./utils";

export function createUninstallCommand(cmdContext: CommandContext, provider: ToitDataProvider): (app: App) => void {
  return async (app: RelatedApp) => {
    await uninstallApp(cmdContext, app.app());
    provider.refresh()
  };
}
