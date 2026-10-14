"use server";

import { type Create{{Pascal}}Input, create{{Pascal}}, type {{Pascal}} } from "@okazi/core"; // TODO: export these from packages/core/src/index.ts
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type Create{{Pascal}}ActionInput = { input: Create{{Pascal}}Input };

// Server actions for {{Pascal}}: forms that change data always go through these (CLAUDE.md, Forms).
// TODO: add update/archive actions together with their core operations.
export async function create{{Pascal}}Action({
  input,
}: Create{{Pascal}}ActionInput): Promise<ActionResult<{{Pascal}}>> {
  return toActionResult({ result: await runOperation({ operation: create{{Pascal}}, input }) });
}
