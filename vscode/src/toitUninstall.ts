// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { App, RelatedApp } from "./app";
import { Context, uninstallApp } from "./utils";

export function createUninstallCommand(ctx: Context): (app: App) => void {
  return async(app: RelatedApp) => {
    await uninstallApp(ctx, app.app());
    ctx.refreshDeviceView();
  };
}
