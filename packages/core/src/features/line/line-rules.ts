import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkBookable, checkPeriod } from "../occupancy/occupancy-rules";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckOrderInput = Db & { orderId: string };

/** A line belongs to an active order of the organization. */
export async function checkOrder({ context, orderId }: CheckOrderInput) {
  const found = await context.db.order.count({ where: { id: orderId } });
  if (found > 0) return ok({ value: true });
  const message = "Unknown order";
  return invalid({ message, issues: [{ path: "orderId", message }] });
}

export type CheckPlaceInput = Db & {
  orderId: string;
  itemId: string | null;
  layoutId: string | null;
  /** The layout the line already books: kept as is, it may since have been archived. */
  keptLayoutId?: string | null;
};

const atLayout = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "layoutId", message }] });

/**
 * Where a line is held: no item at all, or an active item (general or the order
 * customer's own bundle). A layout (ADR 0103) needs a `BOOKABLE` item and must be one of the
 * item's active layouts; a layout without an item is a `VALIDATION` issue on `layoutId`.
 */
export async function checkPlace({
  context,
  orderId,
  itemId,
  layoutId,
  keptLayoutId,
}: CheckPlaceInput) {
  if (!itemId) {
    return layoutId ? atLayout({ message: "A layout needs a bookable item" }) : ok({ value: true });
  }
  const order = await context.db.order.findFirst({ where: { id: orderId } });
  const customerId = order?.customerId;
  const known = await checkItem({ context, itemId, customerId });
  if (!known.ok || !layoutId) return known;
  const bookable = await checkBookable({ context, itemId, customerId });
  if (!bookable.ok) return bookable;
  const kept = layoutId === keptLayoutId;
  const found = await context.db.setupLayout.count({
    where: { id: layoutId, itemId, ...(kept ? { status: { in: ["ACTIVE", "ARCHIVED"] } } : {}) },
  });
  return found > 0 ? ok({ value: true }) : atLayout({ message: "The item has no such layout" });
}

type CheckItemInput = Db & { itemId: string; customerId: string | undefined };

/** An active item of the organization: general or the order customer's own bundle. */
async function checkItem({ context, itemId, customerId }: CheckItemInput) {
  const item = await context.db.item.findFirst({ where: { id: itemId } });
  const foreign = item?.customerId && customerId && item.customerId !== customerId;
  if (item && !foreign) return ok({ value: true });
  // Never describe an item the caller may not use (ADR 0050, feature scope).
  const message = "Item not found or not allowed";
  return invalid({ message, issues: [{ path: "itemId", message }] });
}

export type LinePeriod = { startsAt: Date | null; endsAt: Date | null };

/** ADR 0052: a line is timed (both set, the end after the start) or untimed (both null). */
export function checkLinePeriod({ startsAt, endsAt }: LinePeriod) {
  if (startsAt && endsAt) return checkPeriod({ startsAt, endsAt });
  if (!startsAt && !endsAt) return ok({ value: true });
  const path = startsAt ? "endsAt" : "startsAt";
  const message = "Give both a start and an end, or neither for an untimed line";
  return invalid({ message, issues: [{ path, message }] });
}
