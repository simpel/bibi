import { ok, type Result } from "../../errors/result";
import { authorize } from "../../operations/authorize";
import type { OperationContext } from "../../operations/types";
import { changeOrderStatus } from "../order/change-status-operation";
import { moveOrder } from "../order/move-order";
import { loadOrder } from "../order/to-order-dto";
import { loadMoveRule } from "../order-status/move-rule";
import type { StatusEvent } from "../order-status/schema";

export type MoveOnEventInput = {
  context: OperationContext;
  orderId: string;
  event: StatusEvent;
};

/**
 * Moves the order into the organization's status for a quote event (ADR 0043), as the acting
 * user: `order.changeStatus`'s permission and every move check apply. The status stays when the
 * organization has no status for the event, the order is already there, or the organization does
 * not allow the move from its current status. Any other blocker (a required reason or assignee, a
 * line collision) fails the move, and so the quote command, without changing anything.
 */
export async function moveOnQuoteEvent({
  context,
  orderId,
  event,
}: MoveOnEventInput): Promise<Result<true>> {
  const to = await context.db.orderStatus.findFirst({ where: { event } });
  const before = await loadOrder({ context, id: orderId });
  if (!to || !before || to.id === before.statusId) return ok({ value: true });
  const from = await context.db.orderStatus.findFirstOrThrow({ where: { id: before.statusId } });
  if (from.closes || !(await loadMoveRule({ context, from, to })).allowed) {
    return ok({ value: true });
  }
  const allowed = authorize({ operation: changeOrderStatus, context });
  if (!allowed.ok) return allowed;
  const moved = await moveOrder({ context, before, to, trigger: "QUOTE_EVENT" });
  return moved.ok ? ok({ value: true }) : moved;
}
