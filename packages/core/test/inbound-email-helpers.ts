import { createId } from "@paralleldrive/cuid2";
import type { InboundMailContent } from "../src/index";

export type InboundMailInput = { recipients: string[] };

/** A verified received mail as the webhook hands it over, with a fresh provider id. */
export function inboundMail({ recipients }: InboundMailInput): InboundMailContent {
  return {
    providerEmailId: `email_${createId()}`,
    messageId: "<111@example.test>",
    fromAddress: "Guest <guest@example.test>",
    toAddresses: recipients,
    subject: "Re: your booking",
    text: "We will be 40 guests.",
    html: "<p>We will be 40 guests.</p>",
    attachments: [{ id: "att_1", filename: "menu.pdf", contentType: "application/pdf", size: 10 }],
    receivedAt: new Date("2026-10-15T10:00:00.000Z"),
    recipients,
  };
}
