"use server";

import { type MyWork, type MyWorkInput, viewMyWork } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/** The next window of the caller's timeline, read as they scroll (spec: home). */
export async function loadMyWorkAction({ from, to }: MyWorkInput): Promise<ActionResult<MyWork>> {
  return toActionResult({
    result: await runOperation({ operation: viewMyWork, input: { from, to } }),
  });
}
