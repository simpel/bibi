import type { Result, TicketDto } from "@okazi/core";
import type { MailMessage, SentMail } from "./schema";
import { sendMail } from "./send-mail";

export type SendTicketMailInput = Omit<MailMessage, "replyTo"> & {
  ticket: Pick<TicketDto, "inboundAddress">;
};

/**
 * Sends a mail about a ticket (ADR 0012). Reply-to is the ticket's inbound address, so the
 * customer's reply lands on the ticket; without an inbound domain no reply-to is set.
 */
export async function sendTicketMail({
  ticket,
  ...message
}: SendTicketMailInput): Promise<Result<SentMail>> {
  const replyTo = ticket.inboundAddress ?? undefined;
  return sendMail({ ...message, ...(replyTo ? { replyTo } : {}) });
}
