import type { StatusChangeTrigger, OrderStatus } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { mainAssigneeId } from "../assignment/load-assignment";
import type { TransitionGate } from "../order-status/gate-schema";
import { loadMoveRule } from "../order-status/move-rule";
import { applyClosing } from "./cancellation";
import { applyLineMoves, type LinePlan, planLineMoves } from "./plan-line-moves";
import type { OrderDto } from "./schema";
import { recordStatusChange } from "./status-history";
import { statusBlockers } from "./status-rules";
import { ORDER_INCLUDE, toOrderDto } from "./to-order-dto";

export type MoveOrderInput = {
  context: OperationContext;
  /** The order as it is before the move. */
  before: OrderDto;
  to: OrderStatus;
  reason?: string | undefined;
  /**
   * What makes the move, kept in the status history (ADR 0054). Only `QUOTE_EVENT` may enter an
   * event status.
   */
  trigger: StatusChangeTrigger;
};

/** The order's current status, archived or not (an order keeps its status when it is archived). */
const loadFrom = ({ context, id }: { context: OperationContext; id: string }) =>
  context.db.orderStatus.findFirstOrThrow({
    where: { id, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });

type FactsInput = {
  context: OperationContext;
  orderId: string;
  gates: readonly TransitionGate[];
};

/** Whether the order has an accepted quote; only looked up when a gate asks for one. */
async function hasAcceptedQuote({ context, orderId, gates }: FactsInput) {
  if (!gates.includes("ACCEPTED_QUOTE")) return false;
  return (await context.db.quote.count({ where: { orderId, quoteStatus: "ACCEPTED" } })) > 0;
}

type CheckMoveInput = Omit<MoveOrderInput, "to"> & { from: OrderStatus; to: OrderStatus };

/**
 * Everything checked before a move: the move rule (ADR 0076), its gates and their facts, and the line
 * moves the status grid implies (a closing target ignores the grid: it releases every line).
 */
async function checkMove({ context, before, from, to, reason, trigger }: CheckMoveInput) {
  const { allowed, gates } = await loadMoveRule({ context, from, to });
  const subject = { subjectType: "ORDER", subjectId: before.id } as const;
  const assigneeId = await mainAssigneeId({ context, ...subject });
  const lines: LinePlan = to.closes
    ? { moves: [], blockers: [] }
    : await planLineMoves({ context, orderId: before.id, statusId: to.id });
  const acceptedQuote = await hasAcceptedQuote({ context, orderId: before.id, gates });
  const viaEvent = trigger === "QUOTE_EVENT";
  const blockers = [
    ...statusBlockers({ from, to, allowed, gates, assigneeId, reason, viaEvent, acceptedQuote }),
    ...lines.blockers,
  ];
  return { lines, blockers };
}

/**
 * The one place an order's status changes (ADR 0043, 0044, 0054, 0067). The move is atomic: the
 * transition, its gates and the line moves the status grid implies are checked first and
 * every blocker is listed in one `CONFLICT`; then the lines move (entering a closing status
 * releases every line instead) and one `OrderStatusChange` row sets the status by trigger.
 * `holdsUntil` is left as it is. Audited. Shared by `order.changeStatus`, quote events and the
 * order moves of `orderStatus.archive`.
 */
export async function moveOrder({
  context,
  before,
  to,
  reason,
  trigger,
}: MoveOrderInput): Promise<Result<OrderDto>> {
  if (to.id === before.statusId) {
    return conflict({ message: `The order is already in "${to.name}"` });
  }
  const from = await loadFrom({ context, id: before.statusId });
  const { lines, blockers } = await checkMove({ context, before, from, to, reason, trigger });
  if (blockers.length > 0) {
    const message = `Order #${before.reference} cannot move to "${to.name}"`;
    return conflict({ message, issues: blockers });
  }
  const applied = to.closes
    ? await applyClosing({ context, order: before, reason: reason ?? null })
    : await applyLineMoves({ context, moves: lines.moves });
  if (!applied.ok) return applied;
  const change = { fromStatusId: from.id, toStatusId: to.id, reason, trigger };
  await recordStatusChange({ context, orderId: before.id, ...change });
  const row = await context.db.order.findFirstOrThrow({
    where: { id: before.id },
    include: ORDER_INCLUDE,
  });
  const order = toOrderDto({ row });
  context.recordChange({ entityType: "order", entityId: before.id, before, after: order });
  return ok({ value: order });
}
