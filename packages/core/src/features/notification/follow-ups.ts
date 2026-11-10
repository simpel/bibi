import { z } from "zod";
import type { FollowUpInput } from "../../operations/types";
import { mainAssigneeId } from "../assignment/load-assignment";
import { notify } from "./notify";
import { orderFacts, orderPeople } from "./order-people";

type AnyFollowUp = FollowUpInput<unknown, unknown>;

const OrderOutput = z.object({ id: z.string(), statusId: z.string().optional() });

const AssignmentOutput = z.object({
  subjectType: z.string(),
  subjectId: z.string(),
  assigneeId: z.string().nullable(),
  assigneeSource: z.string().nullable(),
});

/**
 * `assignment.assign`: the new assignee of an order (or of a responsibility on it). Clearing a
 * responsibility's choice falls back to its default assignee, who was not just assigned.
 */
export async function notifyAssigned({ output, context }: AnyFollowUp) {
  const parsed = AssignmentOutput.safeParse(output);
  if (!parsed.success || parsed.data.subjectType !== "ORDER") return;
  if (parsed.data.assigneeSource !== "EXPLICIT") return;
  const { subjectId: orderId, assigneeId } = parsed.data;
  const facts = await orderFacts({ context, orderId });
  if (!facts) return;
  await notify({ context, kind: "ASSIGNED", userIds: [assigneeId], orderId, data: facts });
}

/**
 * `order.create|createFromTemplate`: the main assignee the order was created with, read from the
 * stored assignment. A repeated create (the same `intakeKey` returns the first order) tells
 * nobody twice.
 */
export async function notifyCreatedAssignee({ output, context }: AnyFollowUp) {
  const parsed = OrderOutput.safeParse(output);
  if (!parsed.success) return;
  const orderId = parsed.data.id;
  const [assigneeId, told] = await Promise.all([
    mainAssigneeId({ context, subjectType: "ORDER", subjectId: orderId }),
    context.db.notification.count({ where: { orderId, kind: "ASSIGNED" } }),
  ]);
  const facts = assigneeId && told === 0 ? await orderFacts({ context, orderId }) : null;
  if (!facts) return;
  await notify({ context, kind: "ASSIGNED", userIds: [assigneeId], orderId, data: facts });
}

const RunSheetOutput = z.object({
  id: z.string(),
  orderId: z.string(),
  version: z.number(),
  recipients: z.array(z.object({ userId: z.string() })),
});

/** `runSheet.send`: the stored recipients of the sent version (ADR 0055). */
export async function notifyRunSheetSent({ output, context }: AnyFollowUp) {
  const parsed = RunSheetOutput.safeParse(output);
  if (!parsed.success) return;
  const { id: runSheetId, orderId, version, recipients } = parsed.data;
  const [facts, row] = await Promise.all([
    orderFacts({ context, orderId }),
    context.db.runSheet.findFirst({
      where: { id: runSheetId },
      select: { runSheetDefinition: { select: { name: true } } },
    }),
  ]);
  if (!facts) return;
  const data = {
    ...facts,
    runSheetVersion: version,
    runSheetName: row?.runSheetDefinition.name,
  };
  const userIds = recipients.map((recipient) => recipient.userId);
  await notify({ context, kind: "RUN_SHEET_SENT", userIds, orderId, runSheetId, data });
}

/** `order.changeStatus`: everyone on the order, with the move as it was recorded (ADR 0054). */
export async function notifyStatusChanged({ output, context }: AnyFollowUp) {
  const parsed = OrderOutput.safeParse(output);
  if (!parsed.success) return;
  const orderId = parsed.data.id;
  const [facts, change] = await Promise.all([
    orderFacts({ context, orderId }),
    // The move this command made, not a later one that committed right after it.
    context.db.orderStatusChange.findFirst({
      where: { orderId, ...(parsed.data.statusId ? { toStatusId: parsed.data.statusId } : {}) },
      orderBy: { seq: "desc" },
      select: { fromStatus: { select: { name: true } }, toStatus: { select: { name: true } } },
    }),
  ]);
  if (!facts || !change) return;
  const data = {
    ...facts,
    fromStatus: change.fromStatus?.name ?? null,
    toStatus: change.toStatus.name,
  };
  const userIds = await orderPeople({ context, orderId });
  await notify({ context, kind: "ORDER_STATUS_CHANGED", userIds, orderId, data });
}

const PaymentOutput = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  status: z.string(),
  changed: z.boolean(),
  overpaid: z.boolean().optional(),
});

/**
 * `payment.applySignal`: a payment that just succeeded, to everyone on its order; an over-payment
 * (a second attempt paid it again, ADR 0100) is told the same way, flagged `overpaid`.
 */
export async function notifyPaymentReceived({ output, context }: AnyFollowUp) {
  const parsed = PaymentOutput.safeParse(output);
  if (!parsed.success || !parsed.data.changed) return;
  const overpaid = parsed.data.overpaid === true;
  if (!overpaid && parsed.data.status !== "SUCCEEDED") return;
  const { paymentId, orderId } = parsed.data;
  const [facts, payment] = await Promise.all([
    orderFacts({ context, orderId }),
    context.db.payment.findFirst({
      where: { id: paymentId },
      select: { amountMinor: true, currency: true },
    }),
  ]);
  if (!facts || !payment) return;
  const data = { ...facts, ...payment, ...(overpaid ? { overpaid } : {}) };
  const userIds = await orderPeople({ context, orderId });
  await notify({ context, kind: "PAYMENT_RECEIVED", userIds, orderId, paymentId, data });
}
