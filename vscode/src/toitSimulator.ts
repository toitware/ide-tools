import cp = require("child_process");
import { promisify } from "util";
import { OutputChannel, window as Window } from "vscode";
import { Device } from "./device";
import { CommandContext, ensureAuth, getToitPath, selectDevice } from "./utils";
const execFile = promisify(cp.execFile);

async function executeStopCommand(ctx: CommandContext, device?: Device) {
  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    if (!device) device = await selectDevice(ctx, {"activeOnly": false, "simulatorOnly": true});

    if (!device.isSimulator) return Window.showErrorMessage("Non-simulator selected.");
    await execFile(getToitPath(), [ "simulator", "stop", device.deviceID ]);
    ctx.refreshDeviceView(device);
  } catch (e) {
    Window.showErrorMessage(`Stop simulator failed: ${e.message}`);
  }
}

export function createStopSimCommand(cmdContext: CommandContext): () => void {
  return (dev?: Device) => {
    executeStopCommand(cmdContext, dev);
  };
}

async function executeStartCommand(ctx: CommandContext) {
  try {
    await ensureAuth(ctx);
  } catch (e) {
    return Window.showErrorMessage(`Login failed: ${e.message}.`);
  }

  try {
    const name = await Window.showInputBox({"title": "Simulator name", "prompt": "Enter simulator name. Leave empty for random name."});

    if (name === undefined) throw new Error("Name prompt dismissed.");

    const args = [ "simulator", "start" ];
    if (name) {
      args.push("--alias");
      args.push(name);
    }
    const commandProcess = cp.spawn(getToitPath(), args);
    const toitOutput: OutputChannel = ctx.toitOutput();
    toitOutput.show();
    commandProcess.stdout.on("data", data => toitOutput.append(`${data}`));
    commandProcess.stderr.on("data", data => toitOutput.append(`${data}`));

    ctx.refreshDeviceView();
  } catch (e) {
    Window.showErrorMessage(`Start simulator failed: ${e.message}`);
  }
}

export function createStartSimCommand(cmdContext: CommandContext): () => void {
  return () => {
    executeStartCommand(cmdContext);
  };
}
