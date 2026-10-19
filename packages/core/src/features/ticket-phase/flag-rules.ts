import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import type { PhaseEvent, TicketPhaseDto, TicketPhaseFlags } from "./schema";

export type CheckFlagsInput = { flags: Partial<TicketPhaseFlags> };

/** Flags that contradict each other: a ticket could never leave an entry phase that is terminal. */
export function checkFlagCombination({ flags }: CheckFlagsInput): Result<true> {
  if (!(flags.entry && flags.terminal)) return ok({ value: true });
  const message = "A phase cannot be both the entry phase and terminal";
  return invalid({ message, issues: [{ path: "terminal", message }] });
}

export type MinimumInput = {
  /** The active phases as they are now. */
  phases: readonly TicketPhaseDto[];
  /** The phase that changes or leaves. */
  id: string;
  /** Its flags after the change; `null` when it is archived. */
  after: TicketPhaseFlags | null;
};

/**
 * The minimum configuration (ADR 0043): one `entry` and one `terminal` phase. A change that
 * removes the last of either is refused with `CONFLICT`; a change that adds one never is.
 */
export function checkMinimumConfiguration({ phases, id, after }: MinimumInput): Result<true> {
  const others = phases.filter((phase) => phase.id !== id);
  const result = after ? [...others, after] : others;
  const before = phases;
  for (const flag of ["entry", "terminal"] as const) {
    const had = before.some((phase) => phase[flag]);
    if (had && !result.some((phase) => phase[flag])) {
      return conflict({ message: `The organization needs at least one ${flag} phase` });
    }
  }
  return ok({ value: true });
}

export type HandOverEntryInput = {
  context: OperationContext;
  /** The phase that becomes the entry phase; null for one that is about to be created. */
  id: string | null;
};

/**
 * Exactly one phase is the entry phase (ADR 0043, a unique index): making a phase the entry phase
 * takes the flag from the one that had it, before the new one gets it. Audited on the phase that
 * loses it.
 */
export async function handOverEntry({ context, id }: HandOverEntryInput) {
  const previous = await context.db.ticketPhase.findMany({
    where: { entry: true, ...(id ? { id: { not: id } } : {}) },
  });
  for (const row of previous) {
    await context.db.ticketPhase.update({ where: { id: row.id }, data: { entry: false } });
    context.recordChange({ entityId: row.id, before: row, after: { ...row, entry: false } });
  }
}

export type HandOverEventInput = {
  context: OperationContext;
  event: PhaseEvent;
  /** The phase that gets the event; null for one that is about to be created. */
  id: string | null;
};

/**
 * At most one phase per quote event (ADR 0043, a unique index): giving a phase an event takes it
 * from the phase that had it. Audited on the phase that loses it.
 */
export async function handOverEvent({ context, event, id }: HandOverEventInput) {
  const previous = await context.db.ticketPhase.findMany({
    where: { event, ...(id ? { id: { not: id } } : {}) },
  });
  for (const row of previous) {
    await context.db.ticketPhase.update({ where: { id: row.id }, data: { event: null } });
    context.recordChange({ entityId: row.id, before: row, after: { ...row, event: null } });
  }
}

export type SerializeInput = { context: Pick<OperationContext, "db"> };

/**
 * Serializes changes to an organization's phase flags (ADR 0043): taking the row lock of the one
 * entry phase first makes concurrent updates and archives check the minimum configuration one
 * after the other, so two of them cannot each remove "the other" last terminal phase.
 */
export async function serializePhaseChanges({ context }: SerializeInput): Promise<void> {
  await context.db.ticketPhase.updateMany({ where: { entry: true }, data: { entry: true } });
}
