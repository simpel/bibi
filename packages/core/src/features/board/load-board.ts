import type { Board, BoardPhase, Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { visibleBoardWhere } from "./access";
import type { BoardDto, BoardPhaseDto } from "./schema";

/** Prisma `include` for a phase's active statuses, in status order. */
export const WITH_STATUSES = {
  statuses: {
    where: { orderStatus: { status: "ACTIVE" } },
    select: { statusId: true },
    orderBy: [{ orderStatus: { position: "asc" } }, { statusId: "asc" }],
  },
} satisfies Prisma.BoardPhaseInclude;

/** Prisma `include` for a board's active phases in order, each with its statuses. */
export const WITH_PHASES = {
  phases: {
    where: { status: "ACTIVE" },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_STATUSES,
  },
  shares: { select: { userId: true }, orderBy: { userId: "asc" } },
} satisfies Prisma.BoardInclude;

/** Views in list order (ADR 0111): the default first, then by name. */
export const BOARD_ORDER = [
  { isDefault: "desc" },
  { name: "asc" },
  { id: "asc" },
] satisfies Prisma.BoardOrderByWithRelationInput[];

type PhaseRow = BoardPhase & { statuses: readonly { statusId: string }[] };
type BoardRow = Board & {
  phases: readonly PhaseRow[];
  shares: readonly { userId: string }[];
};

export function toBoardPhaseDto({ row }: { row: PhaseRow }): BoardPhaseDto {
  const { statuses, ...phase } = row;
  return { ...phase, statusIds: statuses.map(({ statusId }) => statusId) };
}

/** `context` is the caller, for fields that depend on who reads the view. */
export type BoardDtoInput = { row: BoardRow; context: Pick<OperationContext, "actor"> };

export function toBoardDto({ row }: BoardDtoInput): BoardDto {
  const { position: _position, shares, phases, ...board } = row;
  return {
    ...board,
    sharedWithUserIds: shares.map(({ userId }) => userId),
    phases: phases.map((phase) => toBoardPhaseDto({ row: phase })),
  };
}

type Db = { context: Pick<OperationContext, "db" | "actor"> };

/** One active board the caller sees (ADR 0111) with its phases, or `null`. */
export async function loadBoard({ context, id }: Db & { id: string }) {
  const where = { id, ...visibleBoardWhere({ context }) };
  const row = await context.db.board.findFirst({ where, include: WITH_PHASES });
  return row ? toBoardDto({ row, context }) : null;
}

/**
 * One active board whatever the caller sees: only for audit rows of a change the caller may make
 * without seeing the view (an archived status leaves every board) and for reading back a view
 * whose sharing just changed.
 */
export async function loadAnyBoard({ context, id }: Db & { id: string }) {
  const row = await context.db.board.findFirst({ where: { id }, include: WITH_PHASES });
  return row ? toBoardDto({ row, context }) : null;
}

/** The organization's default view, or `null` when there is none yet. */
export async function loadDefaultBoard({ context }: Db) {
  const row = await context.db.board.findFirst({
    where: { isDefault: true },
    include: WITH_PHASES,
  });
  return row ? toBoardDto({ row, context }) : null;
}

/** One active phase with its statuses, or `null`. */
export async function loadBoardPhase({ context, id }: Db & { id: string }) {
  const row = await context.db.boardPhase.findFirst({ where: { id }, include: WITH_STATUSES });
  return row ? toBoardPhaseDto({ row }) : null;
}
