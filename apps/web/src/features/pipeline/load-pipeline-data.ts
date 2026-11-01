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
import type { TransitionGate } from "@bibi/core/schemas";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

/**
 * What the caller may do in customize mode (ADR 0076): `write` and `remove` are the board's own
 * (`board:write`, `board:delete`); `configure` and `removeStatus` change the flow for everyone
 * (`pipeline:write`, `pipeline:delete`).
 */
export type BoardAccess = {
  write: boolean;
  remove: boolean;
  configure: boolean;
  removeStatus: boolean;
};

export type PipelineData = {
  board: PipelineBoard;
  /** The organization's boards in order (the first is the default), for the switcher. */
  boards: BoardDto[];
  /** Every active ticket status (customize mode places them and opens their dialogs). */
  statuses: TicketStatusDto[];
  /** Ticket status id → the ids it may move to (`ticketStatus.list` transitionsTo, ADR 0076). */
  transitions: Record<string, string[]>;
  /** Ticket status id → target id → the gates of that move (ADR 0067 §5); gate-free moves are absent. */
  moveGates: Record<string, Record<string, TransitionGate[]>>;
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
  const moveGates = Object.fromEntries(
    statuses.value.items.map(({ id, transitionGates }) => [
      id,
      Object.fromEntries(transitionGates.map((g) => [g.toStatusId, g.gates])),
    ]),
  );
  const customerNames = await loadCustomerNames({ board: board.value, abilities });
  const access = {
    write: can({ abilities, permission: "board:write" }),
    remove: can({ abilities, permission: "board:delete" }),
    configure: can({ abilities, permission: "pipeline:write" }),
    removeStatus: can({ abilities, permission: "pipeline:delete" }),
  };
  const value = { board: board.value, boards: boards.value.items, statuses: statuses.value.items };
  return { ok: true, value: { ...value, transitions, moveGates, customerNames, access } };
}
