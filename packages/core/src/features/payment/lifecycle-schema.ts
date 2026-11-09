import { z } from "zod";
import { PROVIDER_KEYS } from "../../providers/provider-keys";
import { PublicTokenSchema } from "./public-token";
import { PAYMENT_AMOUNT_MAX_MINOR, PaymentCreateMethodSchema } from "./schema";

export const PaymentRefundInputSchema = z.object({
  id: z.string().min(1).describe("Id of the SUCCEEDED payment to refund (payment.list)"),
  amountMinor: z
    .number()
    .int()
    .min(1)
    .max(PAYMENT_AMOUNT_MAX_MINOR)
    .optional()
    .describe("Minor units; defaults to what is left to refund (refundableMinor), never more"),
  reason: z.string().trim().min(1).max(500).optional().describe("Why, kept on the refund"),
});

export const PaymentCancelInputSchema = z.object({
  id: z.string().min(1).describe("Id of the PENDING payment to cancel"),
});

const receivableId = ({ what }: { what: string }) =>
  z.string().min(1).optional().describe(`Id of the ${what} the money was paid against`);

/** Exactly one of `quoteId`, `depositId` and `invoiceId` (checked by the handler). */
export const PaymentRecordManualInputSchema = z.object({
  quoteId: receivableId({ what: "SENT or ACCEPTED quote" }),
  depositId: receivableId({ what: "SENT deposit request" }),
  invoiceId: receivableId({ what: "SENT invoice" }),
  amountMinor: z
    .number()
    .int()
    .min(1)
    .max(PAYMENT_AMOUNT_MAX_MINOR)
    .describe("Minor units received, at most the receivable's open balance"),
  paidAt: z.coerce.date().describe("When the money was received, ISO 8601"),
  note: z.string().trim().min(1).max(500).optional().describe("E.g. bank transfer reference"),
});

export const PaymentStartAttemptInputSchema = z.object({
  token: PublicTokenSchema.describe("Token from the public payment page URL"),
  method: PaymentCreateMethodSchema.describe("The method the customer chose"),
});

/** Where the customer pays: a link, or a QR code (Swish), until it expires. */
export const PaymentAttemptSchema = z.object({
  id: z.string(),
  method: PaymentCreateMethodSchema,
  provider: z.enum(PROVIDER_KEYS),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED", "EXPIRED", "CANCELLED"]),
  url: z.string().nullable(),
  qrToken: z.string().nullable(),
  expiresAt: z.date().nullable(),
});

export type PaymentRefundInput = z.infer<typeof PaymentRefundInputSchema>;
export type PaymentRecordManualInput = z.infer<typeof PaymentRecordManualInputSchema>;
export type PaymentStartAttemptInput = z.infer<typeof PaymentStartAttemptInputSchema>;
export type PaymentAttemptDto = z.infer<typeof PaymentAttemptSchema>;
