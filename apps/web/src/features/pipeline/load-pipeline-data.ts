import "server-only";
import {
  listCustomers,
  listTicketStatuses,
  type PipelineBoard,
  pipelineBoard,
  type Result,
} from "@bibi/core";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

export type PipelineData = {
  board: PipelineBoard;
  /** Ticket status id → the ids it may move to (`ticketStatus.list` transitionsTo). */
  transitions: Record<string, string[]>;
  /** Customer id → name; empty when the caller may not view customers (ADR 0050). */
  customerNames: Record<string, string>;
};

const LIMIT = 100;

/**
 * The cards' customer names through `customer.list` (the board carries only ids, ADR 0050
 * "Feature scope"). Without `customer:read`, or when the lookup fails, names stay hidden.
 */
async function loadCustomerNames({ board }: { board: PipelineBoard }) {
  const abilities = await getCallerAbilities();
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

/** The board plus the ticket transitions the drag rules need and the customers' names. */
export async function loadPipelineData(): Promise<Result<PipelineData>> {
  const [board, statuses] = await Promise.all([
    runOperation({ operation: pipelineBoard, input: {} }),
    runOperation({ operation: listTicketStatuses, input: { limit: LIMIT } }),
  ]);
  if (!board.ok) return board;
  if (!statuses.ok) return statuses;
  const transitions = Object.fromEntries(
    statuses.value.items.map(({ id, transitionsTo }) => [id, transitionsTo]),
  );
  const customerNames = await loadCustomerNames({ board: board.value });
  return { ok: true, value: { board: board.value, transitions, customerNames } };
}
