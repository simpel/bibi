"use server";

import { type PhaseGridDto, type PhaseGridSetCellInput, setPhaseGridCell } from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SetPhaseGridCellActionInput = { input: PhaseGridSetCellInput };

export async function setPhaseGridCellAction({
  input,
}: SetPhaseGridCellActionInput): Promise<ActionResult<PhaseGridDto>> {
  return toActionResult({ result: await runOperation({ operation: setPhaseGridCell, input }) });
}
