import type { StateChangeTrigger } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { groupHardHoldBlocker } from "../alternative-group/hard-hold";
import { cellOfTicket } from "../phase-grid/load-grid";
import type { LineRecord } from "./schema";
import { recordStateChange } from "./state-history";
import { LINE_INCLUDE, toLineRecord } from "./to-line-record";

type Db = { context: Pick<OperationContext, "db"> };

export type InitialStateInput = Db & { ticketId: string; itemId: string | null };

/**
 * The state a new line starts in (ADR 0044): the phase grid's cell of the ticket's current phase
 * for its item type, or the type's initial state when the cell is empty. A line without an item
 * has no state.
 */
export async function initialStateOf({ context, ticketId, itemId }: InitialStateInput) {
  const entityTypeId = await itemTypeOf({ context, itemId });
  if (!entityTypeId) return null;
  const cell = await cellOfTicket({ context, ticketId, entityTypeId });
  if (cell) return cell;
  const state = await context.db.itemState.findFirst({
    where: { entityTypeId, initial: true },
    select: { id: true },
  });
  return state?.id ?? null;
}

export type ItemTypeOfInput = Db & { itemId: string | null };

/** The item type of a line's item, or null without an item. */
export async function itemTypeOf({ context, itemId }: ItemTypeOfInput) {
  if (!itemId) return null;
  const item = await context.db.item.findFirst({
    where: { id: itemId },
    select: { entityTypeId: true },
  });
  return item?.entityTypeId ?? null;
}

export type StateAfterMoveInput = Db & { before: LineRecord; itemId: string | null };

/**
 * A line moved to an item of another type (or to no item) leaves its state: it starts over in
 * the new type's state for the ticket's phase (grid cell or initial state). Null when the state
 * stays (same type); otherwise the new state, null for no item.
 */
export async function stateAfterMove({ context, before, itemId }: StateAfterMoveInput) {
  if (itemId === before.itemId) return null;
  const [from, to] = await Promise.all([
    itemTypeOf({ context, itemId: before.itemId }),
    itemTypeOf({ context, itemId }),
  ]);
  if (from === to && before.stateId) return null;
  const stateId = await initialStateOf({ context, ticketId: before.ticketId, itemId });
  return stateId === before.stateId ? null : { stateId };
}

export type ApplyLineStateInput = {
  context: OperationContext;
  before: LineRecord;
  stateId: string;
  /** What made the change, kept in the line's state history (ADR 0054). */
  trigger: StateChangeTrigger;
  /** Set or clear `stateOverridden`; omitted keeps it. */
  overridden?: boolean;
};

/**
 * Moves one line to a state: one `LineStateChange` row ("held since" restarts), whose trigger sets
 * the state and re-derives the hold (ADR 0053, 0054). The change is audited on the line. A
 * collision on a hard hold, or a concurrent change of the line's state, is `CONFLICT`, and so is a
 * second option of an alternative group going hard (ADR 0052).
 */
export async function applyLineState({
  context,
  before,
  stateId,
  trigger,
  overridden,
}: ApplyLineStateInput): Promise<Result<LineRecord>> {
  const blocker = await groupHardHoldBlocker({ context, line: before, stateId, lock: true });
  if (blocker) return conflict({ message: blocker.message, issues: [blocker] });
  const fromStateId = before.stateId;
  await recordStateChange({ context, lineId: before.id, fromStateId, toStateId: stateId, trigger });
  const row = await context.db.line.update({
    where: { id: before.id },
    data: overridden === undefined ? {} : { stateOverridden: overridden },
    include: LINE_INCLUDE,
  });
  const after = toLineRecord({ row });
  context.recordChange({ entityType: "line", entityId: before.id, before, after });
  return ok({ value: after });
}
