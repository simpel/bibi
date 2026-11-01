import { windowsOf } from "../../line-allocation/line-windows";
import { lineIssue, type PlanLineIssue } from "./issue-schema";
import type { OccupancyRow } from "./occupancy-rows";
import { overlaps, type TimedPlannedLine } from "./planned-line";
import type { PlanDemand } from "./pool-sources";

/** A unit is taken by anything but a soft hold or buffer (`takenIn`, as `item.freeUnits`). */
const takes = ({ row }: { row: OccupancyRow }) => row.holdKind !== "SOFT";

export type PoolShortInput = {
  line: TimedPlannedLine;
  buffers: { setup: number; teardown: number };
  demands: readonly PlanDemand[];
  rows: readonly OccupancyRow[];
};

/**
 * `POOL_SHORT` per mandatory demand of the line's item (ADR 0059): the units of its target that
 * no hard hold, buffer or manual block takes in any window the demand holds them for, against
 * the demand's quantity. Kept simple on purpose: one level (a unit's own demands are not
 * chained) and other lines of the same plan do not take units from each other.
 */
export function poolShort({ line, buffers, demands, rows }: PoolShortInput): PlanLineIssue[] {
  const windows = windowsOf({ startsAt: line.startsAt, endsAt: line.endsAt, ...buffers });
  return demands.flatMap((demand) => {
    const held = windows.filter((window) => demand.windows.includes(window.window));
    if (held.length === 0) return [];
    const free = demand.unitIds.filter(
      (unitId) =>
        !rows.some(
          (row) =>
            row.itemId === unitId &&
            takes({ row }) &&
            held.some((window) => overlaps({ a: row, b: window })),
        ),
    ).length;
    if (free >= demand.quantity) return [];
    return [
      lineIssue({
        kind: "POOL_SHORT",
        message: `"${line.name}": ${demand.quantity} unit(s) needed, ${free} free`,
        ...{ demandId: demand.id, needed: demand.quantity, free },
      }),
    ];
  });
}
