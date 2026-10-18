import { INBOUND_BODY_MAX, type InboundEmailReceiveInput } from "./schema";

type MailFields = Omit<InboundEmailReceiveInput, "ticketId">;

const clip = ({ value, max }: { value: string | null; max: number }) =>
  value === null ? null : value.slice(0, max);

/**
 * Fits a received mail into `InboundEmailReceiveInputSchema`. A sender's oversized subject or
 * body must not make the webhook fail (the provider would redeliver forever): long values are
 * cut, the provider keeps the original.
 */
export function clampInboundMail({ mail }: { mail: MailFields }): MailFields {
  return {
    ...mail,
    messageId: clip({ value: mail.messageId, max: 1000 }),
    fromAddress: mail.fromAddress.slice(0, 1000),
    toAddresses: mail.toAddresses.slice(0, 100).map((address) => address.slice(0, 1000)),
    subject: clip({ value: mail.subject, max: 2000 }),
    text: clip({ value: mail.text, max: INBOUND_BODY_MAX }),
    html: clip({ value: mail.html, max: INBOUND_BODY_MAX }),
    attachments: mail.attachments.slice(0, 100).map((attachment) => ({
      ...attachment,
      filename: clip({ value: attachment.filename, max: 500 }),
      contentType: clip({ value: attachment.contentType, max: 200 }),
    })),
  };
}
