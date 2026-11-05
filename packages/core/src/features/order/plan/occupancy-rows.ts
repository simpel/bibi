import type { HoldKind } from "@bibi/db";
import type { OperationContext } from "../../../operations/types";
import { lineBuffers, type PlanSources } from "./plan-sources";
import { asTimed, type Period, type PlannedLine } from "./planned-line";

type Db = { context: Pick<OperationContext, "db"> };

/** One existing hold, buffer or manual block, with the order that holds it (null for a block). */
export type OccupancyRow = Period & {
  id: string;
  itemId: string;
  /** The kind of a line's hold; null for a manual block, which always blocks. */
  holdKind: HoldKind | null;
  type: string;
  lineId: string | null;
  orderReference: number | null;
  orderTitle: string | null;
};

/** The row blocks a hard hold: a hard hold or buffer, or a manual block (as `holdCollisions`). */
export const blocks = ({ row }: { row: OccupancyRow }) =>
  row.holdKind === null || row.holdKind === "HARD";

export type BlockedPeriodInput = { line: PlannedLine; sources: PlanSources };

/**
 * The period a timed line on a bookable item would block (ADR 0059): its own plus its effective
 * setup before and teardown after. Null for an untimed line or one without a bookable item.
 */
export function blockedPeriod({ line, sources }: BlockedPeriodInput): Period | null {
  const item = line.itemId ? sources.items.get(line.itemId) : undefined;
  const timed = asTimed({ line });
  if (!item?.bookable || !timed) return null;
  const { setup, teardown } = lineBuffers({ line, sources });
  return {
    startsAt: new Date(timed.startsAt.getTime() - setup * 60_000),
    endsAt: new Date(timed.endsAt.getTime() + teardown * 60_000),
  };
}

export type LoadOccupancyInput = Db & { itemIds: readonly string[]; window: Period };

/**
 * Every hold, buffer and manual block on the items that overlaps the window, with the holding
 * order's reference: one query for any number of items and lines.
 */
export async function loadOccupancy({
  context,
  itemIds,
  window,
}: LoadOccupancyInput): Promise<OccupancyRow[]> {
  if (itemIds.length === 0) return [];
  const rows = await context.db.occupancy.findMany({
    where: {
      itemId: { in: [...new Set(itemIds)] },
      startsAt: { lt: window.endsAt },
      endsAt: { gt: window.startsAt },
    },
    select: {
      ...{ id: true, itemId: true, holdKind: true, type: true, lineId: true },
      ...{ startsAt: true, endsAt: true },
      line: { select: { order: { select: { reference: true, title: true } } } },
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  return rows.map(({ line, ...row }) => ({
    ...row,
    orderReference: line?.order.reference ?? null,
    orderTitle: line?.order.title ?? null,
  }));
}
