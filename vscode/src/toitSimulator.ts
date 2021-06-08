"use strict";

import cp = require("child_process");
import { window as Window } from "vscode";
import { Device, RelatedDevice } from "./device";
import { CommandContext, ensureAuth, selectDevice } from "./utils";


async function executeStopCommand(ctx: CommandContext, device?: Device) {
  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    if (!device) device = await selectDevice(ctx, {"activeOnly": false, "simulatorOnly": true});

    if (!device.isSimulator) return Window.showErrorMessage(`Non-simulator selected.`);

    cp.spawn("toit", [ "simulator", "stop", device.deviceID ]);
    ctx.refreshDeviceView();
  } catch (e) {
    Window.showErrorMessage(`Stop simulator failed: ${e.message}`);
  }
}

export function createStopSimCommand(cmdContext: CommandContext): () => void {
  return (dev?: RelatedDevice) => {
    executeStopCommand(cmdContext, dev?.device());
  };
}
