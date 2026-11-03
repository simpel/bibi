import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { conflict, notFound } from "../../shared/errors";
import { notifyWorkOrderSent } from "../notification/follow-ups";
import { checkReadable } from "../ticket/ticket-rules";
import { checkNotBlocked } from "./check-blocked";
import { checkStatus } from "./check-status";
import { WorkOrderIdInputSchema, WorkOrderSchema } from "./schema";
import { currentRecipients, storeRecipients } from "./snapshot-recipients";
import { toWorkOrderDto, WORK_ORDER_INCLUDE } from "./to-work-order-dto";

export const sendWorkOrder = defineOperation({
  name: "workOrder.send",
  kind: "command",
  description:
    "Send a work order version to its receiving responsibility: marks the version as sent, which is the " +
    "baseline the next version's ★ changes are measured against. Not for a ticket in a " +
    "closing status (CONFLICT), only the latest version, and a version once. A blocked " +
    "work order (`blocked`: a count matches an item that contains it, see `matches`) gives CONFLICT. " +
    "Needs `ticket:read`: the recipients (the responsibility's assignee and followers on " +
    "the ticket) are stored as a snapshot that later changes do not rewrite.",
  input: WorkOrderIdInputSchema,
  output: WorkOrderSchema,
  permission: "workOrder:write",
  followUp: notifyWorkOrderSent,
  handler: async ({ input: { id }, context }) => {
    const readable = checkReadable({ context, permission: "ticket:read", path: "id" });
    if (!readable.ok) return readable;
    const before = await context.db.workOrder.findFirst({
      where: { id },
      include: WORK_ORDER_INCLUDE,
    });
    if (!before) return notFound({ entity: "WorkOrder" });
    if (before.sentAt) return conflict({ message: `Version ${before.version} is already sent` });
    const { ticketId, workOrderDefinitionId, version, responsibilityId } = before;
    const newer = await context.db.workOrder.count({
      where: { ticketId, workOrderDefinitionId, version: { gt: version } },
    });
    if (newer > 0) return conflict({ message: "A newer version exists; send that one instead" });
    const unblocked = checkNotBlocked({ workOrder: toWorkOrderDto({ row: before }) });
    if (!unblocked.ok) return unblocked;
    const ticketStatus = await checkStatus({ context, ticketId });
    if (!ticketStatus.ok) return ticketStatus;
    const recipients = await currentRecipients({ context, ticketId, responsibilityId });
    await context.db.workOrder.update({
      where: { id },
      data: { sentAt: new Date(), sentBy: context.actor.userId },
    });
    await storeRecipients({ context, workOrderId: id, recipients });
    const row = await context.db.workOrder.findFirstOrThrow({
      where: { id },
      include: WORK_ORDER_INCLUDE,
    });
    const workOrder = toWorkOrderDto({ row });
    context.recordChange({
      entityId: id,
      before: toWorkOrderDto({ row: before }),
      after: workOrder,
    });
    return ok({ value: workOrder });
  },
});
