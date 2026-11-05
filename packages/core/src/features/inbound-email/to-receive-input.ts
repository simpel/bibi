import type { InboundMessageReceiveInput } from "../inbound-message/receive-schema";
import { mailSender } from "./address";
import type { InboundEmailReceiveInput } from "./schema";

type MailFields = Omit<InboundEmailReceiveInput, "orderId">;

/** A received mail as an EMAIL message (ADR 0085); the route is added by the caller. */
export function toReceiveInput({
  mail,
}: {
  mail: MailFields;
}): Omit<InboundMessageReceiveInput, "endpointId" | "orderId"> {
  const sender = mailSender({ address: mail.fromAddress });
  return {
    channel: "EMAIL",
    fromName: sender.name?.slice(0, 500) ?? null,
    fromEmail: sender.email.slice(0, 1000),
    fromPhone: null,
    subject: mail.subject,
    text: mail.text ?? "",
    formFields: null,
    attachments: mail.attachments,
    externalId: mail.providerEmailId,
    receivedAt: mail.receivedAt,
    details: {
      messageId: mail.messageId,
      fromAddress: mail.fromAddress,
      toAddresses: mail.toAddresses,
      html: mail.html,
    },
  };
}
