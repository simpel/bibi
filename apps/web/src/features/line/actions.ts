"use server";

import {
  archiveLine,
  changeLineState,
  createLine,
  followLinePhase,
  type LineCreateInput,
  type LineDto,
  type LineUpdateInput,
  updateLine,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateLineActionInput = { input: LineCreateInput };
export type UpdateLineActionInput = { input: LineUpdateInput };
export type ArchiveLineActionInput = { id: string };

export async function createLineAction({
  input,
}: CreateLineActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({ result: await runOperation({ operation: createLine, input }) });
}

export async function updateLineAction({
  input,
}: UpdateLineActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({ result: await runOperation({ operation: updateLine, input }) });
}

export async function archiveLineAction({
  id,
}: ArchiveLineActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveLine, input: { id } }),
  });
}

export type ChangeLineStateActionInput = { lineId: string; stateId: string };

/** Overrides one line's state (ADR 0044). */
export async function changeLineStateAction({
  lineId,
  stateId,
}: ChangeLineStateActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({
    result: await runOperation({ operation: changeLineState, input: { lineId, stateId } }),
  });
}

export type FollowLinePhaseActionInput = { lineId: string };

/** Lets an overridden line follow the ticket's phase again (ADR 0044). */
export async function followLinePhaseAction({
  lineId,
}: FollowLinePhaseActionInput): Promise<ActionResult<LineDto>> {
  return toActionResult({
    result: await runOperation({ operation: followLinePhase, input: { lineId } }),
  });
}
