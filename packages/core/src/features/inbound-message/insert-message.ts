import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import type { FormFields, InboundChannel, InboundMessageDto } from "./schema";
import { toInboundMessageDto } from "./to-inbound-message-dto";

export type NewInboundMessage = {
  id?: string;
  channel: InboundChannel;
  endpointId: string | null;
  orderId: string | null;
  fromName: string | null;
  fromEmail: string | null;
  fromPhone: string | null;
  subject: string | null;
  text: string;
  formFields: FormFields | null;
  attachments: readonly unknown[];
  externalId: string;
  receivedAt: Date;
  details: Prisma.InputJsonValue;
};

export type InsertMessageInput = { context: OperationContext; message: NewInboundMessage };

/**
 * The one insert of an inbound message (ADR 0085), shared by `receive` and `submit`: stores it and
 * records the audit row. The audit image names the message, never its content.
 */
export async function insertMessage({
  context,
  message: { formFields, attachments, ...message },
}: InsertMessageInput): Promise<InboundMessageDto> {
  const row = await context.db.inboundMessage.create({
    data: {
      ...message,
      ...(formFields ? { formFields: toJson({ value: formFields }) } : {}),
      attachments: toJson({ value: attachments }) ?? [],
      organizationId: context.organizationId,
    },
  });
  const { id, channel, endpointId, orderId, externalId, receivedAt } = row;
  context.recordChange({
    entityId: id,
    after: { id, channel, endpointId, orderId, externalId, receivedAt },
  });
  return toInboundMessageDto({ row });
}
