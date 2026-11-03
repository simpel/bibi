import { z } from "zod";
import type { FollowUpInput } from "../../operations/types";
import { mainAssigneeId } from "../assignment/load-assignment";
import { notify } from "./notify";
import { ticketFacts, ticketPeople } from "./ticket-people";

type AnyFollowUp = FollowUpInput<unknown, unknown>;

const TicketOutput = z.object({ id: z.string(), statusId: z.string().optional() });

const AssignmentOutput = z.object({
  subjectType: z.string(),
  subjectId: z.string(),
  assigneeId: z.string().nullable(),
  assigneeSource: z.string().nullable(),
});

/**
 * `assignment.assign`: the new assignee of a ticket (or of a responsibility on it). Clearing a
 * responsibility's choice falls back to its default assignee, who was not just assigned.
 */
export async function notifyAssigned({ output, context }: AnyFollowUp) {
  const parsed = AssignmentOutput.safeParse(output);
  if (!parsed.success || parsed.data.subjectType !== "TICKET") return;
  if (parsed.data.assigneeSource !== "EXPLICIT") return;
  const { subjectId: ticketId, assigneeId } = parsed.data;
  const facts = await ticketFacts({ context, ticketId });
  if (!facts) return;
  await notify({ context, kind: "ASSIGNED", userIds: [assigneeId], ticketId, data: facts });
}

/**
 * `ticket.create|createFromTemplate`: the main assignee the ticket was created with, read from the
 * stored assignment. A repeated create (the same `intakeKey` returns the first ticket) tells
 * nobody twice.
 */
export async function notifyCreatedAssignee({ output, context }: AnyFollowUp) {
  const parsed = TicketOutput.safeParse(output);
  if (!parsed.success) return;
  const ticketId = parsed.data.id;
  const [assigneeId, told] = await Promise.all([
    mainAssigneeId({ context, subjectType: "TICKET", subjectId: ticketId }),
    context.db.notification.count({ where: { ticketId, kind: "ASSIGNED" } }),
  ]);
  const facts = assigneeId && told === 0 ? await ticketFacts({ context, ticketId }) : null;
  if (!facts) return;
  await notify({ context, kind: "ASSIGNED", userIds: [assigneeId], ticketId, data: facts });
}

const WorkOrderOutput = z.object({
  id: z.string(),
  ticketId: z.string(),
  version: z.number(),
  recipients: z.array(z.object({ userId: z.string() })),
});

/** `workOrder.send`: the stored recipients of the sent version (ADR 0055). */
export async function notifyWorkOrderSent({ output, context }: AnyFollowUp) {
  const parsed = WorkOrderOutput.safeParse(output);
  if (!parsed.success) return;
  const { id: workOrderId, ticketId, version, recipients } = parsed.data;
  const [facts, row] = await Promise.all([
    ticketFacts({ context, ticketId }),
    context.db.workOrder.findFirst({
      where: { id: workOrderId },
      select: { workOrderDefinition: { select: { name: true } } },
    }),
  ]);
  if (!facts) return;
  const data = {
    ...facts,
    workOrderVersion: version,
    workOrderName: row?.workOrderDefinition.name,
  };
  const userIds = recipients.map((recipient) => recipient.userId);
  await notify({ context, kind: "WORK_ORDER_SENT", userIds, ticketId, workOrderId, data });
}

/** `ticket.changeStatus`: everyone on the ticket, with the move as it was recorded (ADR 0054). */
export async function notifyStatusChanged({ output, context }: AnyFollowUp) {
  const parsed = TicketOutput.safeParse(output);
  if (!parsed.success) return;
  const ticketId = parsed.data.id;
  const [facts, change] = await Promise.all([
    ticketFacts({ context, ticketId }),
    // The move this command made, not a later one that committed right after it.
    context.db.ticketStatusChange.findFirst({
      where: { ticketId, ...(parsed.data.statusId ? { toStatusId: parsed.data.statusId } : {}) },
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
  const userIds = await ticketPeople({ context, ticketId });
  await notify({ context, kind: "TICKET_STATUS_CHANGED", userIds, ticketId, data });
}

const PaymentOutput = z.object({
  paymentId: z.string(),
  ticketId: z.string(),
  status: z.string(),
  changed: z.boolean(),
});

/** `payment.applySignal`: a payment that just succeeded, to everyone on its ticket. */
export async function notifyPaymentReceived({ output, context }: AnyFollowUp) {
  const parsed = PaymentOutput.safeParse(output);
  if (!parsed.success || !parsed.data.changed || parsed.data.status !== "SUCCEEDED") return;
  const { paymentId, ticketId } = parsed.data;
  const [facts, payment] = await Promise.all([
    ticketFacts({ context, ticketId }),
    context.db.payment.findFirst({
      where: { id: paymentId },
      select: { amountMinor: true, currency: true },
    }),
  ]);
  if (!facts || !payment) return;
  const data = { ...facts, ...payment };
  const userIds = await ticketPeople({ context, ticketId });
  await notify({ context, kind: "PAYMENT_RECEIVED", userIds, ticketId, paymentId, data });
}
