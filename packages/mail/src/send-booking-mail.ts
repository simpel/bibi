import type { BookingDto, Result } from "@okazi/core";
import type { MailMessage, SentMail } from "./schema";
import { sendMail } from "./send-mail";

export type SendBookingMailInput = Omit<MailMessage, "replyTo"> & {
  booking: Pick<BookingDto, "inboundAddress">;
};

/**
 * Sends a mail about a booking (ADR 0012). Reply-to is the booking's inbound address, so the
 * customer's reply lands on the booking; without an inbound domain no reply-to is set.
 */
export async function sendBookingMail({
  booking,
  ...message
}: SendBookingMailInput): Promise<Result<SentMail>> {
  const replyTo = booking.inboundAddress ?? undefined;
  return sendMail({ ...message, ...(replyTo ? { replyTo } : {}) });
}
