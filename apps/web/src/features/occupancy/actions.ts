"use server";

import {
  archiveOccupancy,
  createOccupancy,
  type OccupancyCreateInput,
  type OccupancyDto,
  type OccupancyUpdateInput,
  updateOccupancy,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateOccupancyActionInput = { input: OccupancyCreateInput };
export type UpdateOccupancyActionInput = { input: OccupancyUpdateInput };
export type ArchiveOccupancyActionInput = { id: string };

export async function createOccupancyAction({
  input,
}: CreateOccupancyActionInput): Promise<ActionResult<OccupancyDto>> {
  return toActionResult({ result: await runOperation({ operation: createOccupancy, input }) });
}

export async function updateOccupancyAction({
  input,
}: UpdateOccupancyActionInput): Promise<ActionResult<OccupancyDto>> {
  return toActionResult({ result: await runOperation({ operation: updateOccupancy, input }) });
}

export async function archiveOccupancyAction({
  id,
}: ArchiveOccupancyActionInput): Promise<ActionResult<OccupancyDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveOccupancy, input: { id } }),
  });
}
