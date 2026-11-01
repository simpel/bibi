import type { Prisma, TicketStatus } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { StatusGates, TransitionGate } from "./gate-schema";
import type { TicketStatusDto } from "./schema";

/** Prisma `include` for what a status's moves and gates are derived from. */
export const WITH_MOVES = {
  transitionsFrom: {
    where: { toStatus: { status: "ACTIVE" } },
    select: { toStatusId: true },
    orderBy: [{ toStatus: { position: "asc" } }, { toStatusId: "asc" }],
  },
  gatesInto: {
    select: { fromStatusId: true, key: true },
    orderBy: [{ key: "asc" }],
  },
} satisfies Prisma.TicketStatusInclude;

export type TicketStatusRow = TicketStatus & {
  transitionsFrom: readonly { toStatusId: string }[];
  gatesInto: readonly { fromStatusId: string | null; key: TransitionGate }[];
};

/** The gates into a status as the flow editor shows them: one entry per source, "any" first. */
function groupGates({ row }: { row: TicketStatusRow }): StatusGates[] {
  const bySource = new Map<string | null, TransitionGate[]>();
  for (const { fromStatusId, key } of row.gatesInto) {
    bySource.set(fromStatusId, [...(bySource.get(fromStatusId) ?? []), key]);
  }
  const sources = [...bySource.keys()].sort((a, b) => (a === null ? -1 : b === null ? 1 : 0));
  return sources.map((fromStatusId) => ({ fromStatusId, gates: bySource.get(fromStatusId) ?? [] }));
}

/** Where a ticket in `row` may go: nothing from a closing status, the list, or every other by-hand status. */
function targetsOf({ row, rows }: { row: TicketStatusRow; rows: readonly TicketStatusRow[] }) {
  if (row.closes) return [];
  if (row.restrictsNext) return row.transitionsFrom.map(({ toStatusId }) => toStatusId);
  return rows.filter(({ id, event }) => id !== row.id && !event).map(({ id }) => id);
}

/** The gates of the move from `row` to `target`: from any status plus from `row`. */
function gatesOfMove({ row, target }: { row: TicketStatusRow; target: TicketStatusRow }) {
  const keys = target.gatesInto
    .filter(({ fromStatusId }) => fromStatusId === null || fromStatusId === row.id)
    .map(({ key }) => key);
  return [...new Set(keys)].sort();
}

export type ToTicketStatusDtoInput = {
  row: TicketStatusRow;
  /** Every active status of the organization (the move targets of a free status). */
  rows: readonly TicketStatusRow[];
};

export function toTicketStatusDto({ row, rows }: ToTicketStatusDtoInput): TicketStatusDto {
  const { transitionsFrom: _from, gatesInto: _into, ...ticketStatus } = row;
  const transitionsTo = targetsOf({ row, rows });
  const transitionGates = transitionsTo.flatMap((toStatusId) => {
    const target = rows.find(({ id }) => id === toStatusId);
    const gates = target ? gatesOfMove({ row, target }) : [];
    return gates.length > 0 ? [{ toStatusId, gates }] : [];
  });
  return { ...ticketStatus, transitionsTo, transitionGates, gatesInto: groupGates({ row }) };
}

export type LoadAllInput = { context: Pick<OperationContext, "db"> };

/** Every active status in order (an organization has a handful, never pages of them). */
export async function loadAllTicketStatuses({ context }: LoadAllInput) {
  const rows = await context.db.ticketStatus.findMany({
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: WITH_MOVES,
  });
  return rows.map((row) => toTicketStatusDto({ row, rows }));
}

export type LoadTicketStatusInput = { context: Pick<OperationContext, "db">; id: string };

/** One active status with its moves, or `null`. */
export async function loadTicketStatus({
  context,
  id,
}: LoadTicketStatusInput): Promise<TicketStatusDto | null> {
  const all = await loadAllTicketStatuses({ context });
  return all.find((ticketStatus) => ticketStatus.id === id) ?? null;
}
