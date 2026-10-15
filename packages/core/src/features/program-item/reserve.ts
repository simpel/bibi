import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { addChangeover } from "../occupancy/add-changeover";
import { toOccupancyDto } from "../occupancy/to-occupancy-dto";
import { PROGRAM_ITEM_SOURCE, type ProgramItemDto } from "./schema";

export type ReserveInput = { context: OperationContext; programItem: ProgramItemDto };

/**
 * Occupies the program item's bookable item (ADR 0022): `BOOKING` for its period and, with a
 * setup, `SETUP` for the changeover right before. An overlap is refused by the database and
 * surfaces as `CONFLICT`, so the whole command rolls back. No item = nothing to occupy.
 */
export async function reserveProgramItem({ context, programItem }: ReserveInput) {
  const { id, itemId, setupId, startsAt, endsAt } = programItem;
  if (!itemId) return ok({ value: true });
  const source = { sourceType: PROGRAM_ITEM_SOURCE, sourceId: id };
  const row = await context.db.occupancy.create({
    data: {
      organizationId: context.organizationId,
      itemId,
      type: "BOOKING",
      startsAt,
      endsAt,
      ...source,
    },
  });
  context.recordChange({
    entityType: "occupancy",
    entityId: row.id,
    after: toOccupancyDto({ row }),
  });
  if (!setupId) return ok({ value: true });
  const changeover = await addChangeover({ context, itemId, setupId, startsAt, ...source });
  return changeover.ok ? ok({ value: true }) : changeover;
}

export type ReleaseInput = { context: OperationContext; id: string };

/** Releases (archives) every occupancy the program item holds. */
export async function releaseProgramItem({ context, id }: ReleaseInput): Promise<Result<true>> {
  const rows = await context.db.occupancy.updateManyAndReturn({
    where: { sourceType: PROGRAM_ITEM_SOURCE, sourceId: id },
    data: { status: "ARCHIVED" },
  });
  for (const row of rows) {
    const after = toOccupancyDto({ row });
    const before = { ...after, status: "ACTIVE" };
    context.recordChange({ entityType: "occupancy", entityId: row.id, before, after });
  }
  return ok({ value: true });
}
