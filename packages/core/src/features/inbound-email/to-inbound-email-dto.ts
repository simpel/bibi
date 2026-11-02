import type { InboundMessage } from "@bibi/db";
import { z } from "zod";
import { EmailDetailsSchema } from "../inbound-message/receive-schema";
import { InboundAttachmentSchema, type InboundEmailDto } from "./schema";

const AttachmentsSchema = z.array(InboundAttachmentSchema).catch([]);

export type ToInboundEmailDtoInput = { row: InboundMessage & { ticketId: string } };

/**
 * An EMAIL message in the old `InboundEmail` shape, for the `inboundEmail.list|get` aliases
 * (ADR 0085 decision 7). The headers come from the email channel's `details`.
 */
export function toInboundEmailDto({ row }: ToInboundEmailDtoInput): InboundEmailDto {
  const parsed = EmailDetailsSchema.safeParse(row.details);
  const details = parsed.success
    ? parsed.data
    : { messageId: null, fromAddress: row.fromEmail ?? "", toAddresses: [], html: null };
  return {
    id: row.id,
    organizationId: row.organizationId,
    ticketId: row.ticketId,
    providerEmailId: row.externalId,
    messageId: details.messageId,
    fromAddress: details.fromAddress,
    toAddresses: details.toAddresses,
    subject: row.subject,
    text: row.text === "" ? null : row.text,
    html: details.html,
    attachments: AttachmentsSchema.parse(row.attachments),
    receivedAt: row.receivedAt,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}
