
import cp = require("child_process");
import { promisify } from "util";
import { Context } from "./utils";
const execFile = promisify(cp.execFile);

export function toitExecFileSync(ctx: Context, ...args: string[]): string {
  return cp.execFileSync(ctx.toitExec, args);
}

export function toitExecFilePromise(ctx: Context, ...args: string[]): Promise<{stdout: string, stderr: string}> {
  return execFile(ctx.toitExec, args);
}

export function toitExecFile(ctx: Context, ...args: string[]): cp.ChildProcess {
  return cp.execFile(ctx.toitExec, args);
}

export function toitSpawn(ctx: Context, ...args: string[]): void {
  cp.spawn(ctx.toitExec, args);
}
