import { effectiveQuantity } from "../../line/effective-values";
import { clashIssues } from "./clash-issues";
import { lineIssue, type PlanLineIssue } from "./issue-schema";
import type { Availability } from "./load-availability";
import { selfOverlaps, setupCapacity } from "./own-checks";
import { lineBuffers, type PlanSources } from "./plan-sources";
import { asTimed, type Period, type PlannedLine } from "./planned-line";
import { poolShort } from "./pool-short";
import type { StartState } from "./start-states";

export type EvaluateLineInput = {
  plan: readonly PlannedLine[];
  /** The blocked period of each line of the plan, by index. */
  periods: readonly (Period | null)[];
  index: number;
  /** `<plan>.<line>`, the key of the line's outside-hours warning. */
  key: string;
  headcount: number;
  sources: PlanSources;
  /** Null when the caller may not see availability (no `item:read`, ADR 0071). */
  availability: Availability | null;
};

type AvailabilityInput = Pick<EvaluateLineInput, "sources" | "periods" | "index" | "key"> & {
  line: PlannedLine;
  state: StartState | null;
  quantity: number | null;
  availability: Availability;
};

/** The issues that read other bookings, pools, capacities and hours. */
function availabilityIssues({
  line,
  state,
  quantity,
  availability,
  sources,
  periods,
  index,
  key,
}: AvailabilityInput): PlanLineIssue[] {
  const period = periods[index];
  const clashes =
    period && line.itemId && !state?.released
      ? clashIssues({
          ...{ name: line.name, itemId: line.itemId, period, rows: availability.rows },
          hard: state?.hold === "HARD",
        })
      : [];
  const capacity =
    line.itemId && line.setupId
      ? sources.capacities.get(`${line.itemId} ${line.setupId}`)
      : undefined;
  const demands = line.itemId ? (availability.demands.get(line.itemId) ?? []) : [];
  const timed = asTimed({ line });
  const buffers = lineBuffers({ line, sources });
  const pool = timed ? poolShort({ line: timed, buffers, demands, rows: availability.rows }) : [];
  const hours = hoursIssues({ line, warning: availability.hours.get(key) });
  return [...clashes, ...setupCapacity({ line, quantity, capacity }), ...pool, ...hours];
}

type HoursInput = {
  line: PlannedLine;
  warning: { id: string; kind: "OUTSIDE_ITEM_HOURS" | "OUTSIDE_VENUE_HOURS" } | undefined;
};

/** `OUTSIDE_HOURS` from the line's outside-hours warning (ADR 0064), advisory. */
const hoursIssues = ({ line, warning }: HoursInput): PlanLineIssue[] =>
  warning
    ? [
        lineIssue({
          kind: "OUTSIDE_HOURS",
          message: `"${line.name}" is outside the hours that apply`,
          ...{ hoursKind: warning.kind, hoursOwnerId: warning.id },
        }),
      ]
    : [];

/**
 * One planned line's start state (ADR 0081 decision 8), effective quantity and issues. Without
 * availability only what the plan itself shows is reported (`SELF_OVERLAP`).
 */
export function evaluateLine({
  plan,
  periods,
  index,
  key,
  sources,
  headcount,
  availability,
}: EvaluateLineInput) {
  const line = plan[index] as PlannedLine;
  const item = line.itemId ? sources.items.get(line.itemId) : undefined;
  const state = item ? sources.stateOf({ entityTypeId: item.entityTypeId }) : null;
  const ticket = { estimatedHeadcount: headcount, guaranteedHeadcount: null };
  const quantity = effectiveQuantity({ quantity: line.quantity ?? null, ticket });
  const own = selfOverlaps({ lines: plan, periods, index });
  const issues = availability
    ? availabilityIssues({
        ...{ line, state, quantity: quantity.value, availability },
        ...{ sources, periods, index, key },
      })
    : [];
  const [clashes, rest] = [
    issues.filter((issue) => issue.kind === "HARD_CLASH" || issue.kind === "SOFT_OVERLAP"),
    issues.filter((issue) => issue.kind !== "HARD_CLASH" && issue.kind !== "SOFT_OVERLAP"),
  ];
  return { stateId: state?.id ?? null, quantity, issues: [...clashes, ...own, ...rest] };
}
