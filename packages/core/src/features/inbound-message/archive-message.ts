import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { toInboundMessageDto } from "./to-inbound-message-dto";

export type ArchiveMessageInput = { context: OperationContext; id: string };

/** Deletes an inbox message by archiving it; one attached to an order is refused (CONFLICT). */
export async function archiveMessage({ context, id }: ArchiveMessageInput) {
  const before = await context.db.inboundMessage.findFirst({ where: { id } });
  if (!before) return notFound({ entity: "Message" });
  if (before.orderId) {
    return conflict({ message: "A message attached to an order is not in the inbox" });
  }
  const row = await context.db.inboundMessage.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  context.recordChange({
    entityId: id,
    before: { id, status: before.status },
    after: { id, status: row.status },
  });
  return ok({ value: toInboundMessageDto({ row }) });
}
