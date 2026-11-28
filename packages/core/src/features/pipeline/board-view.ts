import { ok } from "../../errors/result";
import { DEFAULT_CURRENCY } from "../../number/number-formats";
import type { HandlerInput } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { loadBoard, loadDefaultBoard } from "../board/load-board";
import { resolveHorizon } from "../dashboard/horizon";
import { boardColumns } from "./board-columns";
import { countOrders, loadOrderCards } from "./load-cards";
import type { PipelineBoardInput } from "./schema";
import { loadTaskCards } from "./task-cards";

const DAY_MS = 86_400_000;

const EMPTY = {
  ...{ boardId: null, boardName: null, columns: [], cards: [], taskCards: [] },
  ...{ currency: DEFAULT_CURRENCY, unmappedCount: 0 },
};

/**
 * `pipeline.board`: the board's phases as columns, its orders as cards (ADR 0067) and its open
 * tasks without an order as task cards (ADR 0121).
 */
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
  const [statuses, horizon] = await Promise.all([
    context.db.orderStatus.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    resolveHorizon({ context }),
  ]);
  const mapped = board.phases.flatMap((phase) => phase.statusIds);
  const load = { context, input: filter, since };
  const [cards, taskCards, unmappedCount] = await Promise.all([
    loadOrderCards({ ...load, horizon, statusIds: { in: mapped } }),
    loadTaskCards({ context, input: filter, statusIds: mapped, statuses }),
    countOrders({ ...load, statusIds: { notIn: mapped } }),
  ]);
  const layout = boardColumns({ board, statuses, cards, taskCards });
  return ok({ value: { ...layout, currency: DEFAULT_CURRENCY, unmappedCount } });
}
