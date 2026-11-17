"use server";

import { setWorkingHours, type WorkingHoursDto, type WorkingHoursSetInput } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/** Replaces the signed-in member's own working week in this organization (ADR 0061). */
export async function saveWorkingHoursAction({
  input,
}: {
  input: WorkingHoursSetInput;
}): Promise<ActionResult<WorkingHoursDto>> {
  return toActionResult({ result: await runOperation({ operation: setWorkingHours, input }) });
}
