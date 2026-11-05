import type { OperationContext } from "../../operations/types";
import { loadSlot } from "../assignment/load-assignment";
import type { RunSheetDto } from "./schema";

export type SnapshotRecipientsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  orderId: string;
  responsibilityId: string;
};

/**
 * Who a run sheet goes to right now (ADR 0055): the responsibility's assignee on the order, then its
 * followers. Defaults and explicit choices are read when the run sheet is sent, then stored.
 */
export async function currentRecipients({
  context,
  orderId,
  responsibilityId,
}: SnapshotRecipientsInput): Promise<RunSheetDto["recipients"]> {
  const slot = await loadSlot({
    ...{ context, subjectType: "ORDER" as const, subjectId: orderId, responsibilityId },
  });
  const assignee = slot.assigneeId ? [{ userId: slot.assigneeId, role: "ASSIGNEE" as const }] : [];
  const followers = slot.followers
    .filter((follower) => follower.userId !== slot.assigneeId)
    .map(({ userId }) => ({ userId, role: "FOLLOWER" as const }));
  return [...assignee, ...followers];
}

export type StoreRecipientsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  runSheetId: string;
  recipients: RunSheetDto["recipients"];
};

/** Stores the snapshot once, in order; a sent version is never changed afterwards. */
export async function storeRecipients({ context, runSheetId, recipients }: StoreRecipientsInput) {
  for (const [position, { userId, role }] of recipients.entries()) {
    await context.db.runSheetRecipient.create({
      data: { organizationId: context.organizationId, runSheetId, userId, role, position },
    });
  }
}
