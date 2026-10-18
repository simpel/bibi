import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import type { HoldKind } from "../item-state/hold-kind";
import { addChangeover } from "../occupancy/add-changeover";
import { releaseOccupancyBySource } from "../occupancy/release-by-source";
import { toOccupancyDto } from "../occupancy/to-occupancy-dto";
import { PROGRAM_ITEM_SOURCE, type ProgramItemDto } from "./schema";

export type ReserveInput = { context: OperationContext; programItem: ProgramItemDto };

type HoldOfInput = { context: Pick<OperationContext, "db">; programItem: ProgramItemDto };

/**
 * The hold a line's state gives its item (ADR 0044): the state's `hold` when the item is
 * `BOOKABLE` and the state is not released, otherwise `NONE`.
 */
export async function holdOfLine({ context, programItem }: HoldOfInput): Promise<HoldKind> {
  const { itemId, stateId } = programItem;
  if (!itemId || !stateId) return "NONE";
  const [state, bookable] = await Promise.all([
    context.db.itemState.findFirst({
      where: { id: stateId },
      select: { hold: true, released: true },
    }),
    context.db.item.count({
      where: { id: itemId, entityType: { behaviours: { has: "BOOKABLE" } } },
    }),
  ]);
  if (!state || state.released || bookable === 0) return "NONE";
  return state.hold;
}

/**
 * Occupies the line's bookable item as its state says (ADR 0044): a `HOLD` of the state's kind for
 * its period and, for a hard hold with a setup, `SETUP` for the changeover right before. Soft holds
 * may overlap; an overlap with a hard hold, setup time or block is refused by the database and
 * surfaces as `CONFLICT`, so the whole command rolls back.
 */
export async function reserveProgramItem({ context, programItem }: ReserveInput) {
  const { id, itemId, setupId, startsAt, endsAt } = programItem;
  const holdKind = await holdOfLine({ context, programItem });
  if (!itemId || holdKind === "NONE") return ok({ value: true });
  const source = { sourceType: PROGRAM_ITEM_SOURCE, sourceId: id };
  const row = await context.db.occupancy.create({
    data: {
      ...{ organizationId: context.organizationId, itemId, type: "HOLD", holdKind },
      ...{ startsAt, endsAt, ...source },
    },
  });
  context.recordChange({
    entityType: "occupancy",
    entityId: row.id,
    after: toOccupancyDto({ row }),
  });
  if (!setupId || holdKind !== "HARD") return ok({ value: true });
  const changeover = await addChangeover({ context, itemId, setupId, startsAt, ...source });
  return changeover.ok ? ok({ value: true }) : changeover;
}

export type ReleaseInput = { context: OperationContext; id: string };

/** Releases (archives) every occupancy the program item holds. */
export const releaseProgramItem = ({ context, id }: ReleaseInput): Promise<Result<true>> =>
  releaseOccupancyBySource({ context, sourceType: PROGRAM_ITEM_SOURCE, sourceId: id });

/** Releases the line's occupancy and derives it again from its current state and place. */
export async function rederiveProgramItem({ context, programItem }: ReserveInput) {
  await releaseProgramItem({ context, id: programItem.id });
  return reserveProgramItem({ context, programItem });
}
