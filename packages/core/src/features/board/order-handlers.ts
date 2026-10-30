import type { z } from "zod";
import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { serializeStatusChanges } from "../ticket-status/flag-rules";
import { loadBoard, toBoardDto, WITH_PHASES } from "./load-board";
import {
  type BoardIdInputSchema,
  BoardListOutputSchema,
  type BoardReorderInputSchema,
  BoardSchema,
} from "./schema";

/** Every active board in order (an organization has a handful). */
async function loadAllBoards({ context }: { context: Parameters<typeof loadBoard>[0]["context"] }) {
  const rows = await context.db.board.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_PHASES,
  });
  return rows.map((row) => toBoardDto({ row }));
}

export const reorderBoardsHandler = async ({
  input: { ids },
  context,
}: HandlerInput<z.infer<typeof BoardReorderInputSchema>>) => {
  const current = await loadAllBoards({ context });
  const known = new Set(current.map((board) => board.id));
  const complete = ids.length === current.length && new Set(ids).size === ids.length;
  if (!complete || ids.some((id) => !known.has(id))) {
    const message = "List every active board exactly once";
    return invalid({ message, issues: [{ path: "ids", message }] });
  }
  for (const [position, id] of ids.entries()) {
    const before = current.find((board) => board.id === id);
    if (!before || before.position === position) continue;
    await context.db.board.update({ where: { id }, data: { position } });
    context.recordChange({ entityId: id, before, after: { ...before, position } });
  }
  return ok({ value: { items: await loadAllBoards({ context }), nextCursor: null } });
};

export const archiveBoardHandler = async ({
  input: { id },
  context,
}: HandlerInput<z.infer<typeof BoardIdInputSchema>>) => {
  const before = await loadBoard({ context, id });
  if (!before) return notFound({ entity: "Board" });
  // The pipeline lock (ADR 0043): concurrent archives count one after the other.
  await serializeStatusChanges({ context });
  if ((await context.db.board.count()) <= 1) {
    return conflict({ message: "The organization needs at least one board" });
  }
  await context.db.boardPhaseStatus.deleteMany({ where: { boardId: id } });
  await context.db.boardPhase.updateMany({
    where: { boardId: id },
    data: { status: "ARCHIVED" },
  });
  await context.db.board.update({ where: { id }, data: { status: "ARCHIVED" } });
  const after = { ...before, phases: [], status: "ARCHIVED" as const };
  context.recordChange({ entityId: id, before, after });
  return ok({ value: after });
};
