import type { Board, BoardPhase, Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { BoardDto, BoardPhaseDto } from "./schema";

/** Prisma `include` for a phase's active statuses, in status order. */
export const WITH_STATUSES = {
  statuses: {
    where: { ticketStatus: { status: "ACTIVE" } },
    select: { statusId: true },
    orderBy: [{ ticketStatus: { position: "asc" } }, { statusId: "asc" }],
  },
} satisfies Prisma.BoardPhaseInclude;

/** Prisma `include` for a board's active phases in order, each with its statuses. */
export const WITH_PHASES = {
  phases: {
    where: { status: "ACTIVE" },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_STATUSES,
  },
} satisfies Prisma.BoardInclude;

type PhaseRow = BoardPhase & { statuses: readonly { statusId: string }[] };
type BoardRow = Board & { phases: readonly PhaseRow[] };

export function toBoardPhaseDto({ row }: { row: PhaseRow }): BoardPhaseDto {
  const { statuses, ...phase } = row;
  return { ...phase, statusIds: statuses.map(({ statusId }) => statusId) };
}

export function toBoardDto({ row }: { row: BoardRow }): BoardDto {
  return { ...row, phases: row.phases.map((phase) => toBoardPhaseDto({ row: phase })) };
}

type Db = { context: Pick<OperationContext, "db"> };

/** One active board with its phases, or `null`. */
export async function loadBoard({ context, id }: Db & { id: string }) {
  const row = await context.db.board.findFirst({ where: { id }, include: WITH_PHASES });
  return row ? toBoardDto({ row }) : null;
}

/** The default board: the first active one by position, or `null` when there is none. */
export async function loadDefaultBoard({ context }: Db) {
  const row = await context.db.board.findFirst({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_PHASES,
  });
  return row ? toBoardDto({ row }) : null;
}

/** One active phase with its statuses, or `null`. */
export async function loadBoardPhase({ context, id }: Db & { id: string }) {
  const row = await context.db.boardPhase.findFirst({ where: { id }, include: WITH_STATUSES });
  return row ? toBoardPhaseDto({ row }) : null;
}
