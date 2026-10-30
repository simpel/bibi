import { ok } from "../../errors/result";
import type { HandlerInput } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { loadBoard, loadDefaultBoard } from "../board/load-board";
import { boardColumns } from "./board-columns";
import { countTickets, loadTicketCards } from "./load-cards";
import type { PipelineBoardInput } from "./schema";

const DAY_MS = 86_400_000;

const EMPTY = { boardId: null, boardName: null, columns: [], cards: [], unmappedCount: 0 };

/** `pipeline.board`: the board's phases as columns and its tickets as cards (ADR 0067). */
export async function pipelineBoardHandler({ input, context }: HandlerInput<PipelineBoardInput>) {
  const board = input.boardId
    ? await loadBoard({ context, id: input.boardId })
    : await loadDefaultBoard({ context });
  if (!board && input.boardId) return notFound({ entity: "Board" });
  if (!board) return ok({ value: EMPTY });
  const since = new Date(Date.now() - input.closedWithinDays * DAY_MS);
  const filter = {
    ...input,
    assigneeId: input.assigneeId ?? board.assigneeId ?? undefined,
    entityTypeId: input.entityTypeId ?? board.entityTypeId ?? undefined,
  };
  const statuses = await context.db.ticketStatus.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
  const mapped = board.phases.flatMap((phase) => phase.statusIds);
  const load = { context, input: filter, since };
  const cards = await loadTicketCards({ ...load, statusIds: { in: mapped } });
  const unmappedCount = await countTickets({ ...load, statusIds: { notIn: mapped } });
  return ok({ value: { ...boardColumns({ board, statuses, cards }), unmappedCount } });
}
