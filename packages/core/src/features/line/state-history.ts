import type { StateChangeTrigger } from "@okazi/db";
import type { OperationContext } from "../../operations/types";

/** `include` for the newest state change of a line: "held since" (ADR 0054). */
export const LATEST_STATE_CHANGE = {
  stateChanges: { select: { changedAt: true, seq: true }, orderBy: { seq: "desc" }, take: 1 },
} as const;

export type LatestStateChange = { stateChanges: readonly { changedAt: Date; seq: number }[] };

export type RecordStateChangeInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "actor">;
  lineId: string;
  /** The state the change was decided from; null for the first row of a new line. */
  fromStateId: string | null;
  toStateId: string | null;
  trigger: StateChangeTrigger;
};

/**
 * Appends one row to the line's state history (ADR 0054). The trigger on insert sets
 * `Line.stateId` (`domain_history.sql`), which re-derives the line's hold (ADR 0053); it fails
 * with CONFLICT when the line left `fromStateId` in the meantime. The only way a line's state
 * changes.
 */
export async function recordStateChange({
  context,
  lineId,
  fromStateId,
  toStateId,
  trigger,
}: RecordStateChangeInput): Promise<void> {
  await context.db.lineStateChange.create({
    data: {
      organizationId: context.organizationId,
      lineId,
      fromStateId,
      toStateId,
      trigger,
      changedBy: context.actor.userId,
    },
  });
}

export type RecordFirstStateInput = Pick<RecordStateChangeInput, "context" | "lineId"> & {
  stateId: string | null;
};

/** The first entry of a new line's state history (trigger `SYSTEM`); none for a line without a state. */
export async function recordFirstState({ context, lineId, stateId }: RecordFirstStateInput) {
  if (!stateId) return;
  await recordStateChange({
    context,
    lineId,
    fromStateId: null,
    toStateId: stateId,
    trigger: "SYSTEM",
  });
}

type HeldRow = { id: string; startsAt: Date | null } & LatestStateChange;

const time = ({ at }: { at: Date | null }) => at?.getTime() ?? Number.POSITIVE_INFINITY;

/** Insertion order of the row's newest state change: strictly the order the lines were held. */
const heldOrder = ({ row }: { row: HeldRow }) =>
  row.stateChanges[0]?.seq ?? Number.POSITIVE_INFINITY;

/**
 * Line rows by start (untimed last, as Postgres sorts nulls), then the line held first (ADR
 * 0044: overlapping holders of one item are shown in the order they were held), then id.
 */
export function byHeldSince<T extends HeldRow>({ rows }: { rows: readonly T[] }): T[] {
  return [...rows].sort(
    (a, b) =>
      time({ at: a.startsAt }) - time({ at: b.startsAt }) ||
      heldOrder({ row: a }) - heldOrder({ row: b }) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
