import { hasHardClash } from "./clash-issues";
import type { OccupancyRow } from "./occupancy-rows";
import { type Period, type PlannedLine, shift } from "./planned-line";

/** The step between candidate starts (ADR 0081: "first free start"). */
export const FREE_START_STEP_MS = 15 * 60_000;

export type FirstFreeStartInput = {
  plan: readonly PlannedLine[];
  /** The period each line would hold, null when it holds nothing. */
  periods: readonly (Period | null)[];
  rows: readonly OccupancyRow[];
  requestedStart: Date;
  /** The end of the requested day in the organization's zone (ADR 0064). */
  dayEnd: Date;
};

/**
 * The earliest start on the requested day, from the requested start in 15-minute steps, at
 * which no line of the plan meets a hard hold, hard buffer or manual block when the whole plan
 * moves by the same amount. Null when every candidate clashes. In memory, no queries.
 */
export function firstFreeStart({
  plan,
  periods,
  rows,
  requestedStart,
  dayEnd,
}: FirstFreeStartInput): Date | null {
  const start = requestedStart.getTime();
  for (let ms = 0; start + ms < dayEnd.getTime(); ms += FREE_START_STEP_MS) {
    const clashes = plan.some((line, index) => {
      const period = periods[index];
      if (!line.itemId || !period) return false;
      return hasHardClash({ itemId: line.itemId, period: shift({ period, ms }), rows });
    });
    if (!clashes) return new Date(start + ms);
  }
  return null;
}
