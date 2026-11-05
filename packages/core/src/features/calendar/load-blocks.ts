import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { LATEST_STATE_CHANGE } from "../line/state-history";
import { loadDetails } from "./load-details";
import type { CalendarBlockDto, CalendarRangeInput } from "./schema";

const BLOCK_SELECT = {
  id: true,
  itemId: true,
  type: true,
  holdKind: true,
  allocationId: true,
  startsAt: true,
  endsAt: true,
  note: true,
  line: {
    select: {
      id: true,
      name: true,
      orderId: true,
      stateId: true,
      createdAt: true,
      ...LATEST_STATE_CHANGE,
      order: { select: { reference: true, title: true, statusId: true, holdsUntil: true } },
      state: { select: { name: true, color: true, expires: true } },
    },
  },
} satisfies Prisma.OccupancySelect;

type BlockRow = Prisma.OccupancyGetPayload<{ select: typeof BLOCK_SELECT }>;
type Visible = { program: boolean; pipeline: boolean; order: boolean };
type Filters = Omit<CalendarRangeInput, "from" | "to">;
type BareBlock = Omit<CalendarBlockDto, "details">;

/** The line filters; a manual block has no line, so any of them hides it. */
function lineWhere({ orderId, stateId, statusId }: Filters): Prisma.LineWhereInput | undefined {
  if (!orderId && !stateId && !statusId) return undefined;
  return {
    ...(orderId ? { orderId } : {}),
    ...(stateId ? { stateId } : {}),
    ...(statusId ? { order: { statusId } } : {}),
  };
}

/**
 * One occupancy as a block (ADR 0053): a line's hold and its buffers carry the line's order and
 * state; held since and expiry belong to the soft hold itself, not its buffers.
 */
function toBlock({ row, visible }: { row: BlockRow; visible: Visible }): BareBlock {
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
    lineId: line?.id ?? null,
    orderId: line?.orderId ?? null,
    reference: line?.order.reference ?? null,
    orderTitle: visible.order ? (line?.order.title ?? null) : null,
    title: line ? (visible.program ? line.name : null) : row.note,
    soft,
    allocated: row.allocationId !== null,
    heldAt: softHold && visible.program ? heldAt : null,
    stateId: line?.stateId ?? null,
    stateName: state?.name ?? null,
    stateColor: state?.color ?? null,
    statusId: line?.order.statusId ?? null,
    expiresAt: softHold && line?.state?.expires ? line.order.holdsUntil : null,
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
        ...(filters.itemIds ? { id: { in: filters.itemIds } } : {}),
      },
      ...(line ? { line } : {}),
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: BLOCK_SELECT,
  });
  const visible = {
    program: canView({ context, feature: "program" }),
    pipeline: canView({ context, feature: "pipeline" }),
    order: canView({ context, feature: "order" }),
  };
  const blocks = rows.map((row) => toBlock({ row, visible }));
  const detailsOf = await loadDetails({ context, blocks });
  return blocks.map((block) => ({ ...block, details: detailsOf(block) }));
}
