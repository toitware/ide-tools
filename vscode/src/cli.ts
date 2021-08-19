
import cp = require("child_process");
import { promisify } from "util";
import { Context } from "./utils";
const execFile = promisify(cp.execFile);

export function toitExecFileSync(ctx: Context, ...args: string[]): string {
  return cp.execFileSync(ctx.toitExec, args, {"encoding": "utf8"});
}

export function toitExecFilePromise(ctx: Context, ...args: string[]): Promise<{stdout: string, stderr: string}> {
  return execFile(ctx.toitExec, args);
}

type Callback = (error: cp.ExecFileException | null, stdout: string | Buffer, stderr: string | Buffer) => void
export function toitExecFile(ctx: Context, cb: Callback, ...args: string[]): cp.ChildProcess {
  return cp.execFile(ctx.toitExec, args, cb);
}

export function toitSpawn(ctx: Context, ...args: string[]): void {
  cp.spawn(ctx.toitExec, args);
}
