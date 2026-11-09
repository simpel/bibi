import { z } from "zod";
import { ProviderSignalSchema } from "../../providers/signal";

/** A provider signal about a payment (ADR 0100): an attempt's outcome or a refund. */
export const PaymentSignalSchema = ProviderSignalSchema;

export type PaymentSignal = z.infer<typeof PaymentSignalSchema>;

export const PaymentSignalResultSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED"]),
  changed: z.boolean(),
  overpaid: z
    .boolean()
    .default(false)
    .describe("A second attempt paid a payment already paid: money to give back or keep"),
});

export type PaymentSignalResult = z.infer<typeof PaymentSignalResultSchema>;
