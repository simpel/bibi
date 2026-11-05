import type { Result, OrderDto } from "@bibi/core";
import type { MailMessage, SentMail } from "./schema";
import { sendMail } from "./send-mail";

export type SendOrderMailInput = Omit<MailMessage, "replyTo"> & {
  order: Pick<OrderDto, "inboundAddress">;
};

/**
 * Sends a mail about an order (ADR 0012). Reply-to is the order's inbound address, so the
 * customer's reply lands on the order; without an inbound domain no reply-to is set.
 */
export async function sendOrderMail({
  order,
  ...message
}: SendOrderMailInput): Promise<Result<SentMail>> {
  const replyTo = order.inboundAddress ?? undefined;
  return sendMail({ ...message, ...(replyTo ? { replyTo } : {}) });
}
