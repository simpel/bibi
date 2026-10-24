"use server";

import { type StatusGridDto, type StatusGridSetCellInput, setStatusGridCell } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SetStatusGridCellActionInput = { input: StatusGridSetCellInput };

export async function setStatusGridCellAction({
  input,
}: SetStatusGridCellActionInput): Promise<ActionResult<StatusGridDto>> {
  return toActionResult({ result: await runOperation({ operation: setStatusGridCell, input }) });
}
