import { z } from "zod";

/** A payment request as Swish returns it from GET or posts it to the callback (only what Bibi reads). */
export const SwishPaymentRequestSchema = z.object({
  id: z.string().min(1),
  payeeAlias: z.string().min(1),
  payeePaymentReference: z.string().nullish(),
  paymentReference: z.string().nullish(),
  amount: z.union([z.number(), z.string()]).nullish(),
  status: z.enum(["CREATED", "PAID", "DECLINED", "ERROR", "CANCELLED"]),
  datePaid: z.string().nullish(),
});

/** A refund as Swish returns it from GET or posts it to the callback. */
export const SwishRefundSchema = z.object({
  id: z.string().min(1),
  originalPaymentReference: z.string().min(1),
  payerAlias: z.string().min(1),
  payerPaymentReference: z.string().nullish(),
  amount: z.union([z.number(), z.string()]).nullish(),
  status: z.enum(["CREATED", "VALIDATED", "DEBITED", "PAID", "ERROR"]),
  datePaid: z.string().nullish(),
});

/** What an unsigned callback is trusted for: which object to read again, never its state. */
export const SwishCallbackSchema = z.union([
  z.object({
    id: z.string().regex(/^[0-9A-Fa-f]{32}$/),
    originalPaymentReference: z.string().min(1),
    payerAlias: z.string().min(1),
  }),
  z.object({ id: z.string().regex(/^[0-9A-Fa-f]{32}$/), payeeAlias: z.string().min(1) }),
]);

export type SwishPaymentRequest = z.infer<typeof SwishPaymentRequestSchema>;
export type SwishRefund = z.infer<typeof SwishRefundSchema>;
export type SwishCallback = z.infer<typeof SwishCallbackSchema>;
