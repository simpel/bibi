"use server";

import {
  type FloorElementKindImportOutput,
  type FloorPlanDto,
  type FloorPlanSaveInput,
  importFloorElementKinds,
  type SetupLayoutDto,
  type SetupLayoutSaveInput,
  saveFloorPlan,
  saveSetupLayout,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SaveSetupLayoutActionInput = { input: SetupLayoutSaveInput };
export type SaveFloorPlanActionInput = { input: FloorPlanSaveInput };

export async function saveSetupLayoutAction({
  input,
}: SaveSetupLayoutActionInput): Promise<ActionResult<SetupLayoutDto>> {
  return toActionResult({ result: await runOperation({ operation: saveSetupLayout, input }) });
}

export async function saveFloorPlanAction({
  input,
}: SaveFloorPlanActionInput): Promise<ActionResult<FloorPlanDto>> {
  return toActionResult({ result: await runOperation({ operation: saveFloorPlan, input }) });
}

export async function importFloorKindsAction(): Promise<
  ActionResult<FloorElementKindImportOutput>
> {
  const input = { template: "conference-banquet" as const };
  return toActionResult({
    result: await runOperation({ operation: importFloorElementKinds, input }),
  });
}
