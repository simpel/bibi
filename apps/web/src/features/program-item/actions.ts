"use server";

import {
  archiveProgramItem,
  changeLineState,
  createProgramItem,
  followLinePhase,
  type ProgramItemCreateInput,
  type ProgramItemDto,
  type ProgramItemUpdateInput,
  updateProgramItem,
} from "@okazi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateProgramItemActionInput = { input: ProgramItemCreateInput };
export type UpdateProgramItemActionInput = { input: ProgramItemUpdateInput };
export type ArchiveProgramItemActionInput = { id: string };

export async function createProgramItemAction({
  input,
}: CreateProgramItemActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({ result: await runOperation({ operation: createProgramItem, input }) });
}

export async function updateProgramItemAction({
  input,
}: UpdateProgramItemActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({ result: await runOperation({ operation: updateProgramItem, input }) });
}

export async function archiveProgramItemAction({
  id,
}: ArchiveProgramItemActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({
    result: await runOperation({ operation: archiveProgramItem, input: { id } }),
  });
}

export type ChangeLineStateActionInput = { lineId: string; stateId: string };

/** Overrides one line's state (ADR 0044). */
export async function changeLineStateAction({
  lineId,
  stateId,
}: ChangeLineStateActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({
    result: await runOperation({ operation: changeLineState, input: { lineId, stateId } }),
  });
}

export type FollowLinePhaseActionInput = { lineId: string };

/** Lets an overridden line follow the ticket's phase again (ADR 0044). */
export async function followLinePhaseAction({
  lineId,
}: FollowLinePhaseActionInput): Promise<ActionResult<ProgramItemDto>> {
  return toActionResult({
    result: await runOperation({ operation: followLinePhase, input: { lineId } }),
  });
}
