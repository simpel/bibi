"use server";

import {
  archiveSetupLayout,
  createSetupLayout,
  type FloorElementKindImportOutput,
  type FloorPlanDto,
  type FloorPlanSaveInput,
  importFloorElementKinds,
  type SetupLayoutCreateInput,
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
export type CreateSetupLayoutActionInput = { input: SetupLayoutCreateInput };
export type ArchiveSetupLayoutActionInput = { id: string };

export async function saveSetupLayoutAction({
  input,
}: SaveSetupLayoutActionInput): Promise<ActionResult<SetupLayoutDto>> {
  return toActionResult({ result: await runOperation({ operation: saveSetupLayout, input }) });
}

export async function createSetupLayoutAction({
  input,
}: CreateSetupLayoutActionInput): Promise<ActionResult<SetupLayoutDto>> {
  return toActionResult({ result: await runOperation({ operation: createSetupLayout, input }) });
}

export async function archiveSetupLayoutAction({
  id,
}: ArchiveSetupLayoutActionInput): Promise<ActionResult<SetupLayoutDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveSetupLayout, input: { id } }),
  });
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
