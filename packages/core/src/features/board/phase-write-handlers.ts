import type { z } from "zod";
import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { loadBoardPhase } from "./load-board";
import { insertPhase, placeStatus } from "./phase-layout";
import {
  type BoardPhaseCreateInputSchema,
  type BoardPhaseIdInputSchema,
  BoardPhaseSchema,
  type BoardPhaseUpdateInputSchema,
} from "./schema";

const unknownStatus = () => {
  const message = "Unknown or archived ticket status";
  return invalid({ message, issues: [{ path: "statusIds", message }] });
};

export const createBoardPhaseHandler = async ({
  input,
  context,
}: HandlerInput<z.infer<typeof BoardPhaseCreateInputSchema>>) => {
  const { boardId, name, statusIds } = input;
  const board = await context.db.board.findFirst({ where: { id: boardId } });
  if (!board) return notFound({ entity: "Board" });
  const unique = [...new Set(statusIds)];
  const found = await context.db.ticketStatus.count({ where: { id: { in: unique } } });
  if (found !== unique.length) return unknownStatus();
  const position = input.position ?? Number.MAX_SAFE_INTEGER;
  const row = await insertPhase({ context, boardId, name, position });
  for (const statusId of unique) await placeStatus({ context, boardId, phaseId: row.id, statusId });
  const phase = await loadBoardPhase({ context, id: row.id });
  if (!phase) return notFound({ entity: "Board phase" });
  context.recordChange({ entityId: row.id, after: phase });
  return ok({ value: phase });
};

export const updateBoardPhaseHandler = async ({
  input: { id, ...data },
  context,
}: HandlerInput<z.infer<typeof BoardPhaseUpdateInputSchema>>) => {
  const before = await loadBoardPhase({ context, id });
  if (!before) return notFound({ entity: "Board phase" });
  await context.db.boardPhase.update({ where: { id }, data });
  const after = await loadBoardPhase({ context, id });
  if (!after) return notFound({ entity: "Board phase" });
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};

export const archiveBoardPhaseHandler = async ({
  input: { id },
  context,
}: HandlerInput<z.infer<typeof BoardPhaseIdInputSchema>>) => {
  const before = await loadBoardPhase({ context, id });
  if (!before) return notFound({ entity: "Board phase" });
  await context.db.boardPhaseStatus.deleteMany({ where: { phaseId: id } });
  await context.db.boardPhase.update({ where: { id }, data: { status: "ARCHIVED" } });
  const after = { ...before, statusIds: [], status: "ARCHIVED" as const };
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};
