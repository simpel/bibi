import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import type { OrderStatusDto, OrderStatusFlags, StatusEvent } from "./schema";

export type CheckFlagsInput = { flags: Partial<OrderStatusFlags> };

/** Flags that contradict each other: an order could never leave an entry status that is closing. */
export function checkFlagCombination({ flags }: CheckFlagsInput): Result<true> {
  if (!(flags.entry && flags.closes)) return ok({ value: true });
  const message = "A status cannot be both the entry status and closing";
  return invalid({ message, issues: [{ path: "closes", message }] });
}

export type MinimumInput = {
  /** The active statuses as they are now. */
  statuses: readonly OrderStatusDto[];
  /** The status that changes or leaves. */
  id: string;
  /** Its flags after the change; `null` when it is archived. */
  after: OrderStatusFlags | null;
};

/**
 * The minimum configuration (ADR 0043): one `entry` and one `closes` status. A change that
 * removes the last of either is refused with `CONFLICT`; a change that adds one never is.
 */
export function checkMinimumConfiguration({ statuses, id, after }: MinimumInput): Result<true> {
  const others = statuses.filter((orderStatus) => orderStatus.id !== id);
  const result = after ? [...others, after] : others;
  const before = statuses;
  for (const flag of ["entry", "closes"] as const) {
    const had = before.some((orderStatus) => orderStatus[flag]);
    if (had && !result.some((orderStatus) => orderStatus[flag])) {
      return conflict({ message: `The organization needs at least one ${flag} status` });
    }
  }
  return ok({ value: true });
}

export type HandOverEntryInput = {
  context: OperationContext;
  /** The status that becomes the entry status; null for one that is about to be created. */
  id: string | null;
};

/**
 * Exactly one status is the entry status (ADR 0043, a unique index): making a status the entry status
 * takes the flag from the one that had it, before the new one gets it. Audited on the status that
 * loses it.
 */
export async function handOverEntry({ context, id }: HandOverEntryInput) {
  const previous = await context.db.orderStatus.findMany({
    where: { entry: true, ...(id ? { id: { not: id } } : {}) },
  });
  for (const row of previous) {
    await context.db.orderStatus.update({ where: { id: row.id }, data: { entry: false } });
    context.recordChange({ entityId: row.id, before: row, after: { ...row, entry: false } });
  }
}

export type HandOverEventInput = {
  context: OperationContext;
  event: StatusEvent;
  /** The status that gets the event; null for one that is about to be created. */
  id: string | null;
};

/**
 * At most one status per quote event (ADR 0043, a unique index): giving a status an event takes it
 * from the status that had it. Audited on the status that loses it.
 */
export async function handOverEvent({ context, event, id }: HandOverEventInput) {
  const previous = await context.db.orderStatus.findMany({
    where: { event, ...(id ? { id: { not: id } } : {}) },
  });
  for (const row of previous) {
    await context.db.orderStatus.update({ where: { id: row.id }, data: { event: null } });
    context.recordChange({ entityId: row.id, before: row, after: { ...row, event: null } });
  }
}

export type SerializeInput = { context: Pick<OperationContext, "db"> };

/**
 * Serializes changes to an organization's status flags (ADR 0043): taking the row lock of the one
 * entry status first makes concurrent updates and archives check the minimum configuration one
 * after the other, so two of them cannot each remove "the other" last closing status.
 */
export async function serializeStatusChanges({ context }: SerializeInput): Promise<void> {
  await context.db.orderStatus.updateMany({ where: { entry: true }, data: { entry: true } });
}
