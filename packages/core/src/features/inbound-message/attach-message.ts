import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import type { InboundMessageDto } from "./schema";
import { toInboundMessageDto } from "./to-inbound-message-dto";

export type AttachMessageInput = {
  context: OperationContext;
  id: string;
  ticketId: string;
  /** The input field naming the message; set when it is a reference (`ticket.create`). */
  path?: string;
};

/**
 * Sets a message's ticket, once (ADR 0085 decision 5). The update only matches a message without
 * a ticket, so of two concurrent attaches one gets `CONFLICT`. The ticket is checked by the caller.
 */
export async function attachMessage({
  context,
  id,
  ticketId,
  path,
}: AttachMessageInput): Promise<Result<InboundMessageDto>> {
  const before = await context.db.inboundMessage.findFirst({ where: { id } });
  if (!before) {
    if (!path) return notFound({ entity: "Message" });
    return invalid({ message: "Unknown message", issues: [{ path, message: "Unknown message" }] });
  }
  const message = "The message is already attached to a ticket";
  const issues = [{ path: path ?? "id", message }];
  if (before.ticketId) return conflict({ message, issues });
  const updated = await context.db.inboundMessage.updateMany({
    where: { id, ticketId: null },
    data: { ticketId },
  });
  if (updated.count === 0) return conflict({ message, issues });
  const row = { ...before, ticketId };
  context.recordChange({
    operation: "inboundMessage.attachToTicket",
    entityType: "inboundMessage",
    entityId: id,
    before: { id, ticketId: null },
    after: { id, ticketId },
  });
  return ok({ value: toInboundMessageDto({ row }) });
}
