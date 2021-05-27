"use strict";

import { CommandContext, ensureAuth } from "./utils";

export function createEnsureAuth(cmdContext: CommandContext): () => void {
  return () => {
    ensureAuth(cmdContext);
  };
}
