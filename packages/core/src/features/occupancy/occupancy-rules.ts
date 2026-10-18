import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { MANUAL_OCCUPANCY_TYPES, type OccupancyType } from "./schema";

type Db = Pick<OperationContext, "db">;

export type CheckBookableInput = { context: Db; itemId: string; customerId?: string };

/**
 * Only active items whose type is `BOOKABLE` (ADR 0021) can be occupied. With `customerId` (the
 * ticket's customer) the item must be general or that customer's own package.
 */
export async function checkBookable({
  context,
  itemId,
  customerId,
}: CheckBookableInput): Promise<Result<true>> {
  const item = await context.db.item.findFirst({
    where: { id: itemId, entityType: { behaviours: { has: "BOOKABLE" } } },
  });
  if (item && customerId && item.customerId && item.customerId !== customerId) {
    const message = "The item is a package for another customer";
    return invalid({ message, issues: [{ path: "itemId", message }] });
  }
  if (item) return ok({ value: true });
  const message = "Unknown bookable item";
  return invalid({ message, issues: [{ path: "itemId", message }] });
}

export type CheckPeriodInput = { startsAt: Date; endsAt: Date };

/** A period has a positive length (`[startsAt, endsAt)`). */
export function checkPeriod({ startsAt, endsAt }: CheckPeriodInput): Result<true> {
  if (endsAt > startsAt) return ok({ value: true });
  const message = "The end must be after the start";
  return invalid({ message, issues: [{ path: "endsAt", message }] });
}

export type CheckManualInput = { type: OccupancyType };

/** `occupancy.update|archive` only touch blocks staff made by hand; the rest follow their source. */
export function checkManual({ type }: CheckManualInput): Result<true> {
  if ((MANUAL_OCCUPANCY_TYPES as readonly string[]).includes(type)) return ok({ value: true });
  return conflict({ message: `A ${type} occupancy is changed through its source` });
}
