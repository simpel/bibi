import { z } from "zod";

/** A Stripe event reduced to what changes a payment (see `toStripeAction`). */
export const PaymentSignalSchema = z.object({
  kind: z.enum(["paid", "cancelled", "failed", "refunded"]),
  providerAccountId: z.string().min(1).describe("Connected account the event happened on"),
  providerReference: z.string().min(1).optional().describe("Checkout Session or Invoice id"),
  paymentId: z.string().min(1).optional().describe("Bibi payment id from the charge metadata"),
  refundedMinor: z.number().int().min(0).optional().describe("Total refunded so far"),
});

export type PaymentSignal = z.infer<typeof PaymentSignalSchema>;

export const PaymentSignalResultSchema = z.object({
  paymentId: z.string(),
  ticketId: z.string(),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED"]),
  changed: z.boolean(),
});

export type PaymentSignalResult = z.infer<typeof PaymentSignalResultSchema>;
