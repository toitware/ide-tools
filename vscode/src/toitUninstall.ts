// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { App, RelatedApp } from "./app";
import { CommandContext, uninstallApp } from "./utils";

export function createUninstallCommand(cmdContext: CommandContext): (app: App) => void {
  return async(app: RelatedApp) => {
    await uninstallApp(cmdContext, app.app());
    cmdContext.refreshDeviceView();
  };
}
