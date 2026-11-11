import type { OperationContext } from "../../operations/types";
import { evaluateLine } from "../order/plan/evaluate-line";
import { loadAvailability } from "../order/plan/load-availability";
import { blockedPeriod } from "../order/plan/occupancy-rows";
import { loadPlanSources, type PlanSources } from "../order/plan/plan-sources";
import type { Period, PlannedLine } from "../order/plan/planned-line";
import type { StartState } from "../order/plan/start-states";
import type { LineIssue } from "./issues-schema";
import type { LineDto } from "./schema";

type Db = { context: Pick<OperationContext, "db" | "permissions"> };

export type SavedLineIssuesInput = Db & {
  statusId: string;
  lines: readonly LineDto[];
  withAvailability: boolean;
};

const toPlanned = ({ line }: { line: LineDto }): PlannedLine => ({
  ...{ entityTypeId: line.entityTypeId, name: line.name, itemId: line.itemId },
  ...{ layoutId: line.layoutId, startsAt: line.startsAt, endsAt: line.endsAt },
  ...{ setupMinutes: line.setupMinutes, teardownMinutes: line.teardownMinutes },
  quantity: line.effectiveQuantity,
});

/** Each line's own state (its hold and whether it is released), one query. */
async function statesOf({ context, lines }: Db & { lines: readonly LineDto[] }) {
  const ids = [...new Set(lines.flatMap((line) => (line.stateId ? [line.stateId] : [])))];
  const rows = await context.db.itemState.findMany({
    where: { id: { in: ids } },
    select: { id: true, hold: true, released: true },
  });
  return new Map<string, StartState>(rows.map((row) => [row.id, row]));
}

type WithStateInput = { sources: PlanSources; state: StartState | null };

/** The sources with the line's own state in place of the status grid's start state. */
const withState = ({ sources, state }: WithStateInput): PlanSources => ({
  ...sources,
  stateOf: () => state,
});

/**
 * The planning checks (ADR 0081) on a saved order's lines, each judged in its own state. The
 * order's own holds, buffers and allocations are left out of the occupancy, so a line never
 * clashes with itself or its order; two of its lines on one item meet as SELF_OVERLAP.
 */
export async function savedLineIssues({
  context,
  statusId,
  lines,
  withAvailability,
}: SavedLineIssuesInput): Promise<{ lineId: string; name: string; issues: LineIssue[] }[]> {
  const plan = lines.map((line) => toPlanned({ line }));
  const [sources, states] = await Promise.all([
    loadPlanSources({ context, statusId, lines: plan }),
    statesOf({ context, lines }),
  ]);
  const stateOf = ({ line }: { line: LineDto }) =>
    line.stateId ? (states.get(line.stateId) ?? null) : null;
  const periods: (Period | null)[] = plan.map((planned, index) => {
    const line = lines[index] as LineDto;
    return stateOf({ line })?.released ? null : blockedPeriod({ line: planned, sources });
  });
  const loaded = withAvailability
    ? await loadAvailability({ context, plans: [plan], sources, laterMs: 0 })
    : null;
  const own = new Set(lines.map((line) => line.id));
  const availability = loaded
    ? { ...loaded, rows: loaded.rows.filter((row) => !row.lineId || !own.has(row.lineId)) }
    : null;
  return lines.flatMap((line, index) => {
    const { issues } = evaluateLine({
      ...{ plan, periods, index, key: `0.${index}`, headcount: 0, availability },
      sources: withState({ sources, state: stateOf({ line }) }),
    });
    const mapped = issues.map((issue) => ({
      ...issue,
      otherLineId: issue.otherLineIndex === null ? null : (lines[issue.otherLineIndex]?.id ?? null),
    }));
    return mapped.length > 0 ? [{ lineId: line.id, name: line.name, issues: mapped }] : [];
  });
}
