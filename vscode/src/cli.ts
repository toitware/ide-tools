
import * as cp from "child_process";
import { promisify } from "util";
import { Context } from "./utils";
const pjson = require('./package.json');
const execFile = promisify(cp.execFile);

const env = {
  ...process.env,
  "TOIT_EXTERNAL_APPLICATION": "Toit-VSCodeExtension" + (pjson.version ? "/" + pjson.version : ""),
}

export function toitExecFileSync(ctx: Context, ...args: string[]): string {
  return cp.execFileSync(ctx.toitExec, args, {
    "encoding": "utf8",
    "env": env,
  });
}

export function toitExecFilePromise(ctx: Context, ...args: string[]): Promise<{stdout: string, stderr: string}> {
  return execFile(ctx.toitExec, args, {"env": env});
}

export function toitExecFile(ctx: Context, ...args: string[]): cp.ChildProcess {
  return cp.execFile(ctx.toitExec, args, {"env": env});
}

export function toitSpawn(ctx: Context, ...args: string[]): void {
  cp.spawn(ctx.toitExec, args, {"env": env});
}
