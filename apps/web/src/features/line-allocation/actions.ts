"use server";

import {
  assignLineAllocation,
  type LineAllocationAssignInput,
  type LineAllocationDto,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { loadLineAllocations } from "./load-line-allocations";
import type { AllocationView } from "./ui/allocation-types";

export type AssignLineAllocationActionInput = { input: LineAllocationAssignInput };
export type LoadLineAllocationsActionInput = { lineId: string };

/** Chooses (or, for an optional demand, clears) the unit of one allocation (ADR 0059). */
export async function assignLineAllocationAction({
  input,
}: AssignLineAllocationActionInput): Promise<ActionResult<LineAllocationDto>> {
  return toActionResult({ result: await runOperation({ operation: assignLineAllocation, input }) });
}

/** The slots of a line's demands with their free units, read when the picker opens. */
export async function loadLineAllocationsAction({
  lineId,
}: LoadLineAllocationsActionInput): Promise<ActionResult<AllocationView | null>> {
  return toActionResult({ result: await loadLineAllocations({ lineId }) });
}
