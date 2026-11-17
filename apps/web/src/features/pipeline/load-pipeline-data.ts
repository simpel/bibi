import "server-only";
import {
  type BoardDto,
  listBoards,
  listCustomers,
  listMembers,
  listOrderStatuses,
  type OrderStatusDto,
  type PipelineBoard,
  pipelineBoard,
  type Result,
} from "@bibi/core";
import type { TransitionGate } from "@bibi/core/schemas";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

/**
 * What the caller may do with the board shown (ADR 0076, 0111): `write` edits its name and
 * columns (everyone who sees a view; the default view needs `board:write`), `remove` removes a
 * column (the same), `manage` changes its sharing and archives it (its owner or `board:delete`,
 * never the default view); `configure` and `removeStatus` change the flow for everyone
 * (`pipeline:write`, `pipeline:delete`).
 */
export type BoardAccess = {
  write: boolean;
  remove: boolean;
  manage: boolean;
  configure: boolean;
  removeStatus: boolean;
};

/** A member a view can be shared with. */
export type ShareMember = { userId: string; name: string };

export type PipelineData = {
  board: PipelineBoard;
  /** The views the caller sees, the default first, then by name, for the switcher. */
  boards: BoardDto[];
  /** Every active order status (customize mode places them and opens their dialogs). */
  statuses: OrderStatusDto[];
  /** Order status id → the ids it may move to (`orderStatus.list` transitionsTo, ADR 0076). */
  transitions: Record<string, string[]>;
  /** Order status id → target id → the gates of that move (ADR 0067 §5); gate-free moves are absent. */
  moveGates: Record<string, Record<string, TransitionGate[]>>;
  /** Customer id → name; empty when the caller may not view customers (ADR 0050). */
  customerNames: Record<string, string>;
  /** Members to share the view with, by name (the caller left out). */
  members: ShareMember[];
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

/** The chosen board (default: the default view), the views, statuses, transitions and names. */
export async function loadPipelineData({
  boardId,
}: LoadPipelineDataInput): Promise<Result<PipelineData>> {
  const [board, boards, statuses, members, abilities] = await Promise.all([
    runOperation({ operation: pipelineBoard, input: boardId ? { boardId } : {} }),
    runOperation({ operation: listBoards, input: { limit: LIMIT } }),
    runOperation({ operation: listOrderStatuses, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
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
  const shown = boards.value.items.find(({ id }) => id === board.value.boardId);
  const edit = shown ? !shown.isDefault || can({ abilities, permission: "board:write" }) : false;
  const owner = shown?.ownerId != null && shown.ownerId === abilities.userId;
  const manage =
    shown !== undefined &&
    !shown.isDefault &&
    (owner || can({ abilities, permission: "board:delete" }));
  // Member names label the share list; a failed lookup only leaves it empty.
  const shareMembers = members.ok
    ? members.value.items
        .filter(({ userId }) => userId !== abilities.userId)
        .map(({ userId, name }) => ({ userId, name }))
    : [];
  const access = {
    write: edit,
    remove: edit,
    manage,
    configure: can({ abilities, permission: "pipeline:write" }),
    removeStatus: can({ abilities, permission: "pipeline:delete" }),
  };
  const value = { board: board.value, boards: boards.value.items, statuses: statuses.value.items };
  return {
    ok: true,
    value: { ...value, transitions, moveGates, customerNames, members: shareMembers, access },
  };
}
