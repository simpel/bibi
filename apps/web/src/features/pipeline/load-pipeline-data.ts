import "server-only";
import {
  type BoardDto,
  getBoard,
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
 * never the default view); `configure` changes the flow for everyone (`pipeline:write`); a
 * status is archived only on its own page.
 */
export type BoardAccess = {
  write: boolean;
  remove: boolean;
  manage: boolean;
  configure: boolean;
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
  /** Member user id → name, for the cards' assignees; empty when the lookup fails. */
  memberNames: Record<string, string>;
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

/** The chosen board (default: the default view), the views, statuses, transitions and the names. */
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
  // The shown view is fetched by id: it may fall outside the switcher's first page.
  const shownId = board.value.boardId;
  const shown = shownId
    ? await runOperation({ operation: getBoard, input: { id: shownId } })
    : null;
  if (shown && !shown.ok) return shown;
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
  // Member names are labels on every screen (ADR 0050); a failed lookup only hides avatars.
  const memberNames = members.ok
    ? Object.fromEntries(members.value.items.map(({ userId, name }) => [userId, name]))
    : {};
  const { edit, manage } = shown?.ok ? shown.value.viewerCan : { edit: false, manage: false };
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
  };
  const value = { board: board.value, boards: boards.value.items, statuses: statuses.value.items };
  return {
    ok: true,
    value: {
      ...value,
      ...{ transitions, moveGates, customerNames, memberNames, members: shareMembers, access },
    },
  };
}
