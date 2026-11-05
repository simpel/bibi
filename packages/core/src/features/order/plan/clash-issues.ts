import { lineIssue, type PlanLineIssue } from "./issue-schema";
import { blocks, type OccupancyRow } from "./occupancy-rows";
import { overlaps, type Period } from "./planned-line";

/** The rows of one blocker (a line's hold and its buffers, or one block) as a single period. */
type Blocker = Period & {
  orderReference: number | null;
  orderTitle: string | null;
  hard: boolean;
};

/** One blocker per holding line (its hold and buffers merged) or per manual block. */
function mergeBlockers({ rows }: { rows: readonly OccupancyRow[] }): Blocker[] {
  const byKey = new Map<string, Blocker>();
  for (const row of rows) {
    const hard = blocks({ row });
    const key = `${row.lineId ?? row.id} ${hard}`;
    const seen = byKey.get(key);
    byKey.set(key, {
      startsAt: seen && seen.startsAt < row.startsAt ? seen.startsAt : row.startsAt,
      endsAt: seen && seen.endsAt > row.endsAt ? seen.endsAt : row.endsAt,
      orderReference: row.orderReference,
      orderTitle: row.orderTitle,
      hard,
    });
  }
  return [...byKey.values()];
}

const by = ({ blocker }: { blocker: Blocker }) =>
  blocker.orderReference === null ? "a manual block" : `order #${blocker.orderReference}`;

const when = ({ blocker }: { blocker: Blocker }) =>
  `${blocker.startsAt.toISOString()}–${blocker.endsAt.toISOString()}`;

export type ClashIssuesInput = {
  name: string;
  itemId: string;
  /** The period the line would block, buffers included. */
  period: Period;
  rows: readonly OccupancyRow[];
  /** The line's own start state is hard: Create would refuse a hard clash. */
  hard: boolean;
};

/**
 * The existing holds the line's blocked period meets (ADR 0044): `HARD_CLASH` for a hard hold,
 * hard buffer or manual block, `SOFT_OVERLAP` for a soft hold. One issue per holding line or
 * block, with its order reference and its whole period.
 */
export function clashIssues({ name, itemId, period, rows, hard }: ClashIssuesInput) {
  const met = rows.filter((row) => row.itemId === itemId && overlaps({ a: row, b: period }));
  return mergeBlockers({ rows: met }).map(
    (blocker): PlanLineIssue =>
      lineIssue({
        kind: blocker.hard ? "HARD_CLASH" : "SOFT_OVERLAP",
        message: blocker.hard
          ? `"${name}" clashes with ${by({ blocker })} (${when({ blocker })})`
          : `"${name}" overlaps a soft hold of ${by({ blocker })} (${when({ blocker })})`,
        orderReference: blocker.orderReference,
        orderTitle: blocker.orderTitle,
        startsAt: blocker.startsAt,
        endsAt: blocker.endsAt,
        ...(blocker.hard ? { refusesCreate: hard } : {}),
      }),
  );
}

export type HasHardClashInput = { itemId: string; period: Period; rows: readonly OccupancyRow[] };

/** Whether anything that blocks a hard hold meets the period on the item. */
export const hasHardClash = ({ itemId, period, rows }: HasHardClashInput) =>
  rows.some((row) => row.itemId === itemId && blocks({ row }) && overlaps({ a: row, b: period }));
