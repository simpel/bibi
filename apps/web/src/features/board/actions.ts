"use server";

import {
  archiveBoard,
  archiveBoardPhase,
  type BoardCreateInput,
  type BoardDto,
  type BoardPhaseCreateInput,
  type BoardPhaseDto,
  type BoardUpdateInput,
  createBoard,
  createBoardPhase,
  createTicketStatus,
  moveBoardPhaseStatus,
  reorderBoardPhases,
  reorderBoards,
  type TicketStatusCreateInput,
  type TicketStatusDto,
  updateBoard,
  updateBoardPhase,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { applyNewStatusTransitions } from "./apply-new-status-transitions";

type BoardPage = { items: BoardDto[]; nextCursor: string | null };
export type IdActionInput = { id: string };
export type PhaseUpdateInput = { id: string; name?: string };
export type MoveStatusInput = { boardId: string; statusId: string; phaseId: string | null };

export async function createBoardAction({
  input,
}: {
  input: BoardCreateInput;
}): Promise<ActionResult<BoardDto>> {
  return toActionResult({ result: await runOperation({ operation: createBoard, input }) });
}

export async function updateBoardAction({
  input,
}: {
  input: BoardUpdateInput;
}): Promise<ActionResult<BoardDto>> {
  return toActionResult({ result: await runOperation({ operation: updateBoard, input }) });
}

export async function archiveBoardAction({ id }: IdActionInput): Promise<ActionResult<BoardDto>> {
  const result = await runOperation({ operation: archiveBoard, input: { id } });
  return toActionResult({ result });
}

/** `board.reorder`; the first board is the default one. */
export async function reorderBoardsAction({
  ids,
}: {
  ids: string[];
}): Promise<ActionResult<BoardPage>> {
  return toActionResult({
    result: await runOperation({ operation: reorderBoards, input: { ids } }),
  });
}

export async function createBoardPhaseAction({
  input,
}: {
  input: BoardPhaseCreateInput;
}): Promise<ActionResult<BoardPhaseDto>> {
  return toActionResult({ result: await runOperation({ operation: createBoardPhase, input }) });
}

export async function updateBoardPhaseAction({
  input,
}: {
  input: PhaseUpdateInput;
}): Promise<ActionResult<BoardPhaseDto>> {
  return toActionResult({ result: await runOperation({ operation: updateBoardPhase, input }) });
}

/** `boardPhase.archive`: the column goes, its statuses leave the board; tickets are untouched. */
export async function archiveBoardPhaseAction({
  id,
}: IdActionInput): Promise<ActionResult<BoardPhaseDto>> {
  const result = await runOperation({ operation: archiveBoardPhase, input: { id } });
  return toActionResult({ result });
}

export async function reorderBoardPhasesAction({
  boardId,
  ids,
}: {
  boardId: string;
  ids: string[];
}): Promise<ActionResult<BoardDto>> {
  const result = await runOperation({ operation: reorderBoardPhases, input: { boardId, ids } });
  return toActionResult({ result });
}

/** `boardPhase.moveStatus`: a status into a column of the board, or off it (`phaseId` null). */
export async function moveBoardPhaseStatusAction({
  input,
}: {
  input: MoveStatusInput;
}): Promise<ActionResult<BoardDto>> {
  return toActionResult({ result: await runOperation({ operation: moveBoardPhaseStatus, input }) });
}

/**
 * `ticketStatus.create` from customize mode (on no column until dragged onto one), then default
 * transitions so tickets can move into it at once.
 */
export async function createStatusOnBoardAction({
  input,
  boardId,
}: {
  input: TicketStatusCreateInput;
  boardId: string;
}): Promise<ActionResult<TicketStatusDto>> {
  const created = await runOperation({ operation: createTicketStatus, input });
  if (!created.ok) return toActionResult({ result: created });
  const transitions = await applyNewStatusTransitions({ created: created.value, boardId });
  return toActionResult({ result: transitions.ok ? created : transitions });
}
