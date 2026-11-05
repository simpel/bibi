import type { OperationContext } from "../../../operations/types";
import { evaluateLine } from "./evaluate-line";
import { type Availability, loadAvailability } from "./load-availability";
import { blockedPeriod } from "./occupancy-rows";
import { loadPlanSources, type PlanSources } from "./plan-sources";
import type { Period, PlannedLine } from "./planned-line";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };

export type EvaluatePlansInput = Db & {
  /** The status the lines start in: its grid cells give their states (ADR 0081 decision 8). */
  statusId: string;
  plans: readonly (readonly PlannedLine[])[];
  headcount: number;
  /** Whether to read other bookings, pools and hours (the caller has `item:read`, ADR 0071). */
  withAvailability: boolean;
  /** How far later the lines may be shifted when looking for the first free start. */
  laterMs: number;
};

export type PlansEvaluation = {
  sources: PlanSources;
  /** Per plan and line: the period it would hold, null when it holds nothing. */
  periods: (Period | null)[][];
  availability: Availability | null;
  lines: ReturnType<typeof evaluateLine>[][];
};

type PeriodInput = { line: PlannedLine; sources: PlanSources };

/** The blocked period, or null when the line holds nothing (untimed, not bookable, released). */
function heldPeriod({ line, sources }: PeriodInput): Period | null {
  const item = line.itemId ? sources.items.get(line.itemId) : undefined;
  if (item && sources.stateOf({ entityTypeId: item.entityTypeId })?.released) return null;
  return blockedPeriod({ line, sources });
}

/**
 * The shared planning step (ADR 0081): every plan's lines with their start state, effective
 * quantity and issues. Writes nothing and takes no locks; a fixed number of queries for any
 * number of plans and lines (the pool targets' units are read once per distinct target).
 */
export async function evaluatePlans({
  context,
  statusId,
  plans,
  headcount,
  withAvailability,
  laterMs,
}: EvaluatePlansInput): Promise<PlansEvaluation> {
  const sources = await loadPlanSources({ context, statusId, lines: plans.flat() });
  const periods = plans.map((plan) => plan.map((line) => heldPeriod({ line, sources })));
  const availability = withAvailability
    ? await loadAvailability({ context, plans, sources, laterMs })
    : null;
  const lines = plans.map((plan, p) =>
    plan.map((_, index) =>
      evaluateLine({
        ...{ plan, periods: periods[p] ?? [], index, key: `${p}.${index}` },
        ...{ headcount, sources, availability },
      }),
    ),
  );
  return { sources, periods, availability, lines };
}
