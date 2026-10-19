import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkBookable } from "../occupancy/occupancy-rules";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckTicketInput = Db & { ticketId: string };

/** A program item belongs to an active ticket of the organization. */
export async function checkTicket({ context, ticketId }: CheckTicketInput) {
  const found = await context.db.ticket.count({ where: { id: ticketId } });
  if (found > 0) return ok({ value: true });
  const message = "Unknown ticket";
  return invalid({ message, issues: [{ path: "ticketId", message }] });
}

export type CheckPlaceInput = Db & {
  ticketId: string;
  itemId: string | null;
  setupId: string | null;
};

/**
 * Where a program item is held: no item at all, or an active item (general or the ticket
 * customer's own package). A setup needs a `BOOKABLE` item and one of the item's own setups;
 * a setup without an item is a `VALIDATION` issue on `setupId`.
 */
export async function checkPlace({ context, ticketId, itemId, setupId }: CheckPlaceInput) {
  if (!itemId) {
    if (!setupId) return ok({ value: true });
    const message = "A setup needs a bookable item";
    return invalid({ message, issues: [{ path: "setupId", message }] });
  }
  const ticket = await context.db.ticket.findFirst({ where: { id: ticketId } });
  const customerId = ticket?.customerId;
  const known = await checkItem({ context, itemId, customerId });
  if (!known.ok || !setupId) return known;
  const bookable = await checkBookable({ context, itemId, customerId });
  if (!bookable.ok) return bookable;
  const found = await context.db.itemSetup.count({ where: { itemId, setupId } });
  if (found > 0) return ok({ value: true });
  const message = "The item has no such setup";
  return invalid({ message, issues: [{ path: "setupId", message }] });
}

type CheckItemInput = Db & { itemId: string; customerId: string | undefined };

/** An active item of the organization: general or the ticket customer's own package. */
async function checkItem({ context, itemId, customerId }: CheckItemInput) {
  const item = await context.db.item.findFirst({ where: { id: itemId } });
  const foreign = item?.customerId && customerId && item.customerId !== customerId;
  if (item && !foreign) return ok({ value: true });
  // Never describe an item the caller may not use (ADR 0050, feature scope).
  const message = "Item not found or not allowed";
  return invalid({ message, issues: [{ path: "itemId", message }] });
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
