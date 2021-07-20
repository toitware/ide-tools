
import cp = require("child_process");
import { promisify } from "util";
import { Context } from "./utils";
const execFile = promisify(cp.execFile);

export function toitExecFileSync(ctx: Context, ...args: string[]): string {
  return cp.execFileSync(ctx.toitExec, args, {"encoding": "utf8"});
}

export function toitExecFilePromise(ctx: Context, ...args: string[]): Promise<{stdout: string, stderr: string}> {
  let exec = ctx.toitExec;
  if (args.length > 0 && args[0] === "pkg") {
    exec = ctx.pkgExec;
    args.push("--cache", "~/.cache/toit/tpk/tmp/", "--config", "~/.config/toit/toit.yaml");
  }
  return execFile(exec, args);
}

export function toitExecFile(ctx: Context, ...args: string[]): cp.ChildProcess {
  return cp.execFile(ctx.toitExec, args);
}

export function toitSpawn(ctx: Context, ...args: string[]): void {
  cp.spawn(ctx.toitExec, args);
}
