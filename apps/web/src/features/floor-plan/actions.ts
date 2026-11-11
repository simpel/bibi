"use server";

import {
  archiveLayout,
  createLayout,
  type FloorElementKindImportOutput,
  type FloorPlanDto,
  type FloorPlanSaveInput,
  importFloorElementKinds,
  type LayoutCreateInput,
  type LayoutDto,
  type LayoutSaveInput,
  saveFloorPlan,
  saveLayout,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type SaveLayoutActionInput = { input: LayoutSaveInput };
export type SaveFloorPlanActionInput = { input: FloorPlanSaveInput };
export type CreateLayoutActionInput = { input: LayoutCreateInput };
export type ArchiveLayoutActionInput = { id: string };

export async function saveLayoutAction({
  input,
}: SaveLayoutActionInput): Promise<ActionResult<LayoutDto>> {
  return toActionResult({ result: await runOperation({ operation: saveLayout, input }) });
}

export async function createLayoutAction({
  input,
}: CreateLayoutActionInput): Promise<ActionResult<LayoutDto>> {
  return toActionResult({ result: await runOperation({ operation: createLayout, input }) });
}

export async function archiveLayoutAction({
  id,
}: ArchiveLayoutActionInput): Promise<ActionResult<LayoutDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveLayout, input: { id } }),
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
