import type { InboundMailContent as CoreInboundMail } from "@okazi/core";
import type { InboundMail, InboundMailContent } from "../schema";

export type ToInboundMailInput = { event: InboundMail; content: InboundMailContent };

const toDate = ({ value }: { value: string | null }) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

/** Provider mail (webhook metadata + fetched content) → what core's inbound delivery takes. */
export function toInboundMail({ event, content }: ToInboundMailInput): CoreInboundMail {
  return {
    providerEmailId: content.providerEmailId,
    messageId: content.messageId ?? event.messageId,
    fromAddress: content.from,
    toAddresses: content.to,
    subject: content.subject ?? event.subject,
    text: content.text,
    html: content.html,
    attachments: content.attachments,
    receivedAt: toDate({ value: content.receivedAt ?? event.receivedAt }),
    recipients: [...content.to, ...content.cc, ...content.receivedFor, ...event.to],
  };
}
