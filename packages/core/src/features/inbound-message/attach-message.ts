import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import type { InboundMessageDto } from "./schema";
import { toInboundMessageDto } from "./to-inbound-message-dto";

export type AttachMessageInput = {
  context: OperationContext;
  id: string;
  orderId: string;
  /** The input field naming the message; set when it is a reference (`order.create`). */
  path?: string;
};

/**
 * Sets a message's order, once (ADR 0085 decision 5). The update only matches a message without
 * an order, so of two concurrent attaches one gets `CONFLICT`. The order is checked by the caller.
 */
export async function attachMessage({
  context,
  id,
  orderId,
  path,
}: AttachMessageInput): Promise<Result<InboundMessageDto>> {
  const before = await context.db.inboundMessage.findFirst({ where: { id } });
  if (!before) {
    if (!path) return notFound({ entity: "Message" });
    return invalid({ message: "Unknown message", issues: [{ path, message: "Unknown message" }] });
  }
  const message = "The message is already attached to an order";
  const issues = [{ path: path ?? "id", message }];
  if (before.orderId) return conflict({ message, issues });
  const updated = await context.db.inboundMessage.updateMany({
    where: { id, orderId: null },
    data: { orderId },
  });
  if (updated.count === 0) return conflict({ message, issues });
  const row = { ...before, orderId };
  context.recordChange({
    operation: "inboundMessage.attachToOrder",
    entityType: "inboundMessage",
    entityId: id,
    before: { id, orderId: null },
    after: { id, orderId },
  });
  return ok({ value: toInboundMessageDto({ row }) });
}
