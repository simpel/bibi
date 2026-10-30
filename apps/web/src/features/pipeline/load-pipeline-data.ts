import "server-only";
import {
  type BoardDto,
  listBoards,
  listCustomers,
  listTicketStatuses,
  type PipelineBoard,
  pipelineBoard,
  type Result,
  type TicketStatusDto,
} from "@bibi/core";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

/** What the caller may do with boards (ADR 0067 §8): edit them, and archive boards and columns. */
export type BoardAccess = { write: boolean; remove: boolean };

export type PipelineData = {
  board: PipelineBoard;
  /** The organization's boards in order (the first is the default), for the switcher. */
  boards: BoardDto[];
  /** Every active ticket status (customize mode places them and opens their dialogs). */
  statuses: TicketStatusDto[];
  /** Ticket status id → the ids it may move to (`ticketStatus.list` transitionsTo). */
  transitions: Record<string, string[]>;
  /** Customer id → name; empty when the caller may not view customers (ADR 0050). */
  customerNames: Record<string, string>;
  access: BoardAccess;
};

const LIMIT = 100;

type CustomerNamesInput = { board: PipelineBoard; abilities: CallerAbilities };

/**
 * The cards' customer names through `customer.list` (the board carries only ids, ADR 0050
 * "Feature scope"). Without `customer:read`, or when the lookup fails, names stay hidden.
 */
async function loadCustomerNames({ board, abilities }: CustomerNamesInput) {
  if (!can({ abilities, permission: "customer:read" })) return {};
  const ids = [...new Set(board.cards.map((card) => card.customerId))];
  const chunks = Array.from({ length: Math.ceil(ids.length / LIMIT) }, (_, index) =>
    ids.slice(index * LIMIT, (index + 1) * LIMIT),
  );
  const pages = await Promise.all(
    chunks.map((chunk) =>
      runOperation({ operation: listCustomers, input: { ids: chunk, limit: LIMIT } }),
    ),
  );
  const items = pages.flatMap((page) => (page.ok ? page.value.items : []));
  return Object.fromEntries(items.map(({ id, name }) => [id, name]));
}

export type LoadPipelineDataInput = { boardId?: string | undefined };

/** The chosen board (default: the first), the boards, statuses, transitions and names. */
export async function loadPipelineData({
  boardId,
}: LoadPipelineDataInput): Promise<Result<PipelineData>> {
  const [board, boards, statuses, abilities] = await Promise.all([
    runOperation({ operation: pipelineBoard, input: boardId ? { boardId } : {} }),
    runOperation({ operation: listBoards, input: { limit: LIMIT } }),
    runOperation({ operation: listTicketStatuses, input: { limit: LIMIT } }),
    getCallerAbilities(),
  ]);
  if (!board.ok) return board;
  if (!boards.ok) return boards;
  if (!statuses.ok) return statuses;
  const transitions = Object.fromEntries(
    statuses.value.items.map(({ id, transitionsTo }) => [id, transitionsTo]),
  );
  const customerNames = await loadCustomerNames({ board: board.value, abilities });
  const access = {
    write: can({ abilities, permission: "pipeline:write" }),
    remove: can({ abilities, permission: "pipeline:delete" }),
  };
  const value = { board: board.value, boards: boards.value.items, statuses: statuses.value.items };
  return { ok: true, value: { ...value, transitions, customerNames, access } };
}
