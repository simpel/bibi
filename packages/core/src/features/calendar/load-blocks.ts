import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { LATEST_STATE_CHANGE } from "../line/state-history";
import type { CalendarBlockDto, CalendarRangeInput } from "./schema";

const BLOCK_SELECT = {
  id: true,
  itemId: true,
  type: true,
  holdKind: true,
  startsAt: true,
  endsAt: true,
  note: true,
  line: {
    select: {
      name: true,
      ticketId: true,
      stateId: true,
      createdAt: true,
      ...LATEST_STATE_CHANGE,
      ticket: { select: { reference: true, statusId: true, holdsUntil: true } },
      state: { select: { name: true, color: true, expires: true } },
    },
  },
} satisfies Prisma.OccupancySelect;

type BlockRow = Prisma.OccupancyGetPayload<{ select: typeof BLOCK_SELECT }>;
type Visible = { program: boolean; pipeline: boolean };
type Filters = Omit<CalendarRangeInput, "from" | "to">;

/** The line filters; a manual block has no line, so any of them hides it. */
function lineWhere({ ticketId, stateId, statusId }: Filters): Prisma.LineWhereInput | undefined {
  if (!ticketId && !stateId && !statusId) return undefined;
  return {
    ...(ticketId ? { ticketId } : {}),
    ...(stateId ? { stateId } : {}),
    ...(statusId ? { ticket: { statusId } } : {}),
  };
}

/**
 * One occupancy as a block (ADR 0053): a line's hold and its buffers carry the line's ticket and
 * state; held since and expiry belong to the soft hold itself, not its buffers.
 */
function toBlock({ row, visible }: { row: BlockRow; visible: Visible }): CalendarBlockDto {
  const { line } = row;
  const soft = row.holdKind === "SOFT";
  const softHold = soft && row.type === "HOLD";
  const state = visible.pipeline ? line?.state : undefined;
  const heldAt = line ? (line.stateChanges[0]?.changedAt ?? line.createdAt) : null;
  return {
    id: row.id,
    itemId: row.itemId,
    type: row.type,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    ticketId: line?.ticketId ?? null,
    reference: line?.ticket.reference ?? null,
    title: line ? (visible.program ? line.name : null) : row.note,
    soft,
    heldAt: softHold && visible.program ? heldAt : null,
    stateId: line?.stateId ?? null,
    stateName: state?.name ?? null,
    stateColor: state?.color ?? null,
    statusId: line?.ticket.statusId ?? null,
    expiresAt: softHold && line?.state?.expires ? line.ticket.holdsUntil : null,
  };
}

export type LoadBlocksInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  filters: Filters;
  from: Date;
  to: Date;
};

/** Every active block overlapping `[from, to)`, joined in one query, earliest first. */
export async function loadBlocks({
  context,
  filters,
  from,
  to,
}: LoadBlocksInput): Promise<CalendarBlockDto[]> {
  const line = lineWhere(filters);
  const rows = await context.db.occupancy.findMany({
    where: {
      endsAt: { gt: from },
      startsAt: { lt: to },
      item: {
        ...(filters.venueId ? { venueId: filters.venueId } : {}),
        ...(filters.typeId ? { entityTypeId: filters.typeId } : {}),
      },
      ...(line ? { line } : {}),
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: BLOCK_SELECT,
  });
  const visible = {
    program: canView({ context, feature: "program" }),
    pipeline: canView({ context, feature: "pipeline" }),
  };
  return rows.map((row) => toBlock({ row, visible }));
}
