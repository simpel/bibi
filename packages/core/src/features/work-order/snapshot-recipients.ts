import type { OperationContext } from "../../operations/types";
import { loadSlot } from "../assignment/load-assignment";
import type { WorkOrderDto } from "./schema";

export type SnapshotRecipientsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  ticketId: string;
  responsibilityId: string;
};

/**
 * Who a work order goes to right now (ADR 0055): the responsibility's assignee on the ticket, then its
 * followers. Defaults and explicit choices are read when the work order is sent, then stored.
 */
export async function currentRecipients({
  context,
  ticketId,
  responsibilityId,
}: SnapshotRecipientsInput): Promise<WorkOrderDto["recipients"]> {
  const slot = await loadSlot({
    ...{ context, subjectType: "TICKET" as const, subjectId: ticketId, responsibilityId },
  });
  const assignee = slot.assigneeId ? [{ userId: slot.assigneeId, role: "ASSIGNEE" as const }] : [];
  const followers = slot.followers
    .filter((follower) => follower.userId !== slot.assigneeId)
    .map(({ userId }) => ({ userId, role: "FOLLOWER" as const }));
  return [...assignee, ...followers];
}

export type StoreRecipientsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  workOrderId: string;
  recipients: WorkOrderDto["recipients"];
};

/** Stores the snapshot once, in order; a sent version is never changed afterwards. */
export async function storeRecipients({ context, workOrderId, recipients }: StoreRecipientsInput) {
  for (const [position, { userId, role }] of recipients.entries()) {
    await context.db.workOrderRecipient.create({
      data: { organizationId: context.organizationId, workOrderId, userId, role, position },
    });
  }
}
