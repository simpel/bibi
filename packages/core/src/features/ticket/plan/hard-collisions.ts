import type { AppErrorIssue } from "../../../errors/app-error";
import type { OperationContext } from "../../../operations/types";
import { blockedPeriod, blocks, loadOccupancy, type OccupancyRow } from "./occupancy-rows";
import { loadPlanSources } from "./plan-sources";
import { overlaps, type Period, type PlannedLine } from "./planned-line";

export type HardCollisionsInput = {
  context: Pick<OperationContext, "db">;
  statusId: string;
  lines: readonly PlannedLine[];
  /** Where each line's issues go; `lines.<index>` when left out (add-ons, ADR 0088). */
  paths?: readonly string[];
};

const day = ({ at }: { at: Date }) => at.toISOString().slice(0, 10);

type Hard = { path: string; line: PlannedLine; itemName: string; period: Period };

type IssuesOfInput = { hard: Hard; rows: readonly OccupancyRow[] };

/** One issue per blocker, as `line.changeState` names it: "Knippla is booked by ticket #42 on …". */
function issuesOf({ hard, rows }: IssuesOfInput): AppErrorIssue[] {
  const met = rows.filter(
    (row) =>
      row.itemId === hard.line.itemId && blocks({ row }) && overlaps({ a: row, b: hard.period }),
  );
  const seen = new Set<string>();
  return met.flatMap((row): AppErrorIssue[] => {
    const key = row.lineId ?? row.id;
    if (seen.has(key)) return [];
    seen.add(key);
    const ref = row.ticketReference;
    const by = ref === null ? `blocked (${row.type})` : `booked by ticket #${ref}`;
    const message = `"${hard.line.name}": ${hard.itemName} is ${by} on ${day({ at: row.startsAt })}`;
    return [{ path: hard.path, message }];
  });
}

/**
 * Every hard-hold collision the planned lines would cause (ADR 0044), found before anything is
 * created: each line gets the state the status grid gives its item's type for the start status
 * (else the type's initial state); only a line whose state is a hard hold can collide, with a
 * hard hold, hard buffer or manual block in the period it would block with its buffers. Issues
 * are at the line's path. The database's exclusion constraint stays the guarantee.
 */
export async function hardCollisions({
  context,
  statusId,
  lines,
  paths,
}: HardCollisionsInput): Promise<AppErrorIssue[]> {
  const sources = await loadPlanSources({ context, statusId, lines });
  const hard: Hard[] = lines.flatMap((line, index) => {
    const item = line.itemId ? sources.items.get(line.itemId) : undefined;
    const state = item ? sources.stateOf({ entityTypeId: item.entityTypeId }) : null;
    const period = blockedPeriod({ line, sources });
    if (!item || !period || state?.hold !== "HARD" || state.released) return [];
    return [{ path: paths?.[index] ?? `lines.${index}`, line, itemName: item.name, period }];
  });
  if (hard.length === 0) return [];
  const starts = hard.map((one) => one.period.startsAt.getTime());
  const ends = hard.map((one) => one.period.endsAt.getTime());
  const window = { startsAt: new Date(Math.min(...starts)), endsAt: new Date(Math.max(...ends)) };
  const itemIds = hard.flatMap((one) => (one.line.itemId ? [one.line.itemId] : []));
  const rows = await loadOccupancy({ context, itemIds, window });
  return hard.flatMap((one) => issuesOf({ hard: one, rows }));
}
