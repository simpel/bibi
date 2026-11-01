import { loadHoursWarnings } from "../../../hours/hours-warnings";
import type { OperationContext } from "../../../operations/types";
import { blockedPeriod, loadOccupancy, type OccupancyRow } from "./occupancy-rows";
import type { PlanSources } from "./plan-sources";
import { asTimed, type PlannedLine } from "./planned-line";
import { loadPlanDemands, type PlanDemand } from "./pool-sources";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };

/** What the availability issues are derived from, read once for every plan. */
export type Availability = {
  rows: readonly OccupancyRow[];
  demands: ReadonlyMap<string, readonly PlanDemand[]>;
  /** `<plan>.<line>` → the outside-hours warning of that line. */
  hours: Awaited<ReturnType<typeof loadHoursWarnings>>;
};

/** A day either side covers every buffer (at most a day each, ADR 0059). */
const DAY_MS = 86_400_000;

/** The window every line's blocked period and windows fall in, widened by `laterMs` for shifts. */
function windowOf({ lines, laterMs }: { lines: readonly PlannedLine[]; laterMs: number }) {
  const timed = lines.flatMap((line) => asTimed({ line }) ?? []);
  if (timed.length === 0) return null;
  const starts = timed.map((line) => line.startsAt.getTime());
  const ends = timed.map((line) => line.endsAt.getTime());
  return {
    startsAt: new Date(Math.min(...starts) - DAY_MS),
    endsAt: new Date(Math.max(...ends) + DAY_MS + laterMs),
  };
}

export type LoadAvailabilityInput = Db & {
  plans: readonly (readonly PlannedLine[])[];
  sources: PlanSources;
  /** How far later the lines may be shifted when looking for the first free start. */
  laterMs: number;
};

/**
 * The holds and blocks on every bookable item and demanded unit around the plans (one
 * occupancy query), the items' mandatory demands, and the outside-hours warnings (ADR 0064).
 */
export async function loadAvailability({
  context,
  plans,
  sources,
  laterMs,
}: LoadAvailabilityInput): Promise<Availability> {
  const lines = plans.flat();
  const itemIds = [...new Set(lines.flatMap((line) => (line.itemId ? [line.itemId] : [])))];
  const keyed = plans.flatMap((plan, p) =>
    plan.map((line, i) => ({ id: `${p}.${i}`, itemId: line.itemId ?? null, ...times(line) })),
  );
  const [demands, hours] = await Promise.all([
    loadPlanDemands({ context, itemIds }),
    loadHoursWarnings({ context, lines: keyed }),
  ]);
  const bookable = lines.flatMap((line) =>
    line.itemId && blockedPeriod({ line, sources }) ? [line.itemId] : [],
  );
  const units = [...demands.values()].flat().flatMap((demand) => demand.unitIds);
  const window = windowOf({ lines, laterMs });
  const rows = window
    ? await loadOccupancy({ context, itemIds: [...bookable, ...units], window })
    : [];
  return { rows, demands, hours };
}

const times = ({ startsAt, endsAt }: PlannedLine) => ({
  startsAt: startsAt ?? null,
  endsAt: endsAt ?? null,
});
