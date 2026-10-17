import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkBookable } from "../occupancy/occupancy-rules";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckBookingInput = Db & { bookingId: string };

/** A program item belongs to an active booking of the organization. */
export async function checkBooking({ context, bookingId }: CheckBookingInput) {
  const found = await context.db.booking.count({ where: { id: bookingId } });
  if (found > 0) return ok({ value: true });
  const message = "Unknown booking";
  return invalid({ message, issues: [{ path: "bookingId", message }] });
}

export type CheckPlaceInput = Db & {
  bookingId: string;
  itemId: string | null;
  setupId: string | null;
};

/**
 * Where a program item is held: no item at all, or a `BOOKABLE` item, optionally with one of the
 * item's own setups. The item is general or the booking customer's own package. A setup without an item is a `VALIDATION` issue on `setupId`.
 */
export async function checkPlace({ context, bookingId, itemId, setupId }: CheckPlaceInput) {
  if (!itemId) {
    if (!setupId) return ok({ value: true });
    const message = "A setup needs a bookable item";
    return invalid({ message, issues: [{ path: "setupId", message }] });
  }
  const booking = await context.db.booking.findFirst({ where: { id: bookingId } });
  const bookable = await checkBookable({ context, itemId, customerId: booking?.customerId });
  if (!bookable.ok || !setupId) return bookable;
  const found = await context.db.itemSetup.count({ where: { itemId, setupId } });
  if (found > 0) return ok({ value: true });
  const message = "The item has no such setup";
  return invalid({ message, issues: [{ path: "setupId", message }] });
}

export type PlaceChanged = {
  before: { itemId: string | null; setupId: string | null; startsAt: Date; endsAt: Date };
  after: PlaceChanged["before"];
};

/** True when the occupancy a program item holds must be moved (item, setup or time changed). */
export const placeChanged = ({ before, after }: PlaceChanged): boolean =>
  before.itemId !== after.itemId ||
  before.setupId !== after.setupId ||
  before.startsAt.getTime() !== after.startsAt.getTime() ||
  before.endsAt.getTime() !== after.endsAt.getTime();
