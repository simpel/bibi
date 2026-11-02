import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import type { EmailDetails } from "../inbound-message/receive-schema";
import type { InboundMessageDto } from "../inbound-message/schema";

export type WriteLegacyEmailInput = {
  context: OperationContext;
  message: InboundMessageDto;
  details: EmailDetails;
};

/**
 * Expand phase of ADR 0085 decision 7 (ADR 0013): a mail stored on a ticket is also written to the
 * old `InboundEmail` table with the same id, so the previous release still shows it during a
 * rollout or rollback. Removed with the table in the contract release.
 */
export async function writeLegacyEmail({ context, message, details }: WriteLegacyEmailInput) {
  if (message.channel !== "EMAIL" || !message.ticketId) return;
  await context.db.inboundEmail.create({
    data: {
      id: message.id,
      organizationId: context.organizationId,
      ticketId: message.ticketId,
      providerEmailId: message.externalId,
      messageId: details.messageId,
      fromAddress: details.fromAddress,
      toAddresses: details.toAddresses,
      subject: message.subject,
      text: message.text === "" ? null : message.text,
      html: details.html,
      attachments: toJson({ value: message.attachments }) ?? [],
      receivedAt: message.receivedAt,
    },
  });
}
