import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { rederiveProgramItem } from "./reserve";
import type { ProgramItemDto } from "./schema";
import { toProgramItemDto } from "./to-program-item-dto";

type Db = { context: Pick<OperationContext, "db"> };

export type InitialStateInput = Db & { itemId: string | null };

/**
 * The state a new line starts in (ADR 0044): its item type's initial state. A line without an
 * item has no state. The phase grid (ADR 0044) refines this per phase.
 */
export async function initialStateOf({ context, itemId }: InitialStateInput) {
  const entityTypeId = await itemTypeOf({ context, itemId });
  if (!entityTypeId) return null;
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

export type StateAfterMoveInput = Db & { before: ProgramItemDto; itemId: string | null };

/**
 * A line moved to an item of another type (or to no item) leaves its state: it starts over in
 * the new type's initial state. Empty when the type is unchanged.
 */
export async function stateAfterMove({ context, before, itemId }: StateAfterMoveInput) {
  if (itemId === before.itemId) return {};
  const [from, to] = await Promise.all([
    itemTypeOf({ context, itemId: before.itemId }),
    itemTypeOf({ context, itemId }),
  ]);
  if (from === to && before.stateId) return {};
  const stateId = await initialStateOf({ context, itemId });
  return { stateId, heldAt: new Date(), stateOverridden: false };
}

export type ApplyLineStateInput = {
  context: OperationContext;
  before: ProgramItemDto;
  stateId: string;
  /** Set or clear `stateOverridden`; omitted keeps it. */
  overridden?: boolean;
};

/**
 * Moves one line to a state: `heldAt` restarts, the change is audited on the line and its hold is
 * derived again from the new state (ADR 0044). A collision on a hard hold is `CONFLICT`.
 */
export async function applyLineState({
  context,
  before,
  stateId,
  overridden,
}: ApplyLineStateInput): Promise<Result<ProgramItemDto>> {
  const row = await context.db.programItem.update({
    where: { id: before.id },
    data: {
      stateId,
      heldAt: new Date(),
      ...(overridden === undefined ? {} : { stateOverridden: overridden }),
    },
  });
  const after = toProgramItemDto({ row });
  context.recordChange({ entityType: "programItem", entityId: before.id, before, after });
  const held = await rederiveProgramItem({ context, programItem: after });
  return held.ok ? ok({ value: after }) : held;
}
