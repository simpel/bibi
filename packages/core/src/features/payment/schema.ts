import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { PublicTokenSchema } from "./public-token";

export const PaymentMethodSchema = z.enum(["CARD", "INVOICE"]);
export const PaymentStatusSchema = z.enum([
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]);

/** A payment requested from the customer that settles one receivable (ADR 0028, 0029, 0057). */
export const PaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ticketId: z.string(),
  quoteId: z.string().nullable().describe("The sent quote this payment settles, if any"),
  depositId: z.string().nullable().describe("The deposit request this payment settles, if any"),
  invoiceId: z.string().nullable().describe("The invoice this payment settles, if any"),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  amountMinor: z.number().int().describe("Amount in minor units (öre for SEK)"),
  currency: z.string(),
  applicationFeeMinor: z
    .number()
    .int()
    .nullable()
    .describe("Okazi's application fee on this charge in minor units, agreed at charge time"),
  providerReference: z
    .string()
    .nullable()
    .describe("Stripe Checkout Session or Invoice id; null until Stripe has created it"),
  paymentUrl: z.string().nullable().describe("Hosted checkout or invoice page for the customer"),
  expiresAt: z.date().nullable(),
  paidAt: z.date().nullable(),
  refundedMinor: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const PaymentListInputSchema = z.object({
  ...PageInputShape,
  ticketId: z.string().min(1).describe("Id of the ticket whose payments to list"),
});

export const PaymentListOutputSchema = z.object({
  items: z.array(PaymentSchema),
  nextCursor: z.string().nullable(),
});

export const PaymentIdInputSchema = z.object({ id: z.string().min(1) });

/** Largest amount one payment may request (minor units), a guard against typos. */
export const PAYMENT_AMOUNT_MAX_MINOR = 1_000_000_000;

const receivableId = ({ what }: { what: string }) =>
  z.string().min(1).optional().describe(`Id of the ${what} this payment settles`);

/** Exactly one of `quoteId`, `depositId` and `invoiceId` (checked by the handler). */
export const PaymentCreateInputSchema = z.object({
  quoteId: receivableId({ what: "SENT or ACCEPTED quote (quote.list)" }),
  depositId: receivableId({ what: "SENT deposit request (deposit.list)" }),
  invoiceId: receivableId({ what: "SENT invoice (invoice.list)" }),
  method: PaymentMethodSchema.describe(
    "CARD: a hosted card checkout link. INVOICE: a Stripe invoice emailed to the customer.",
  ),
  amountMinor: z
    .number()
    .int()
    .min(100)
    .max(PAYMENT_AMOUNT_MAX_MINOR)
    .optional()
    .describe(
      "Amount in minor units (öre for SEK), at least 100; defaults to the receivable's open " +
        "balance and may be lower for a partial payment, never higher",
    ),
  description: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe(
      "Text the customer sees on the checkout or invoice line; defaults to the receivable's",
    ),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentDto = z.infer<typeof PaymentSchema>;
export type PaymentPage = z.infer<typeof PaymentListOutputSchema>;
export type PaymentCreateInput = z.infer<typeof PaymentCreateInputSchema>;

export const PublicPaymentInputSchema = z.object({
  token: PublicTokenSchema.describe("Token from the public payment page URL"),
});

/** What the customer sees on the public page: no customer or ticket details (ADR 0028). */
export const PublicPaymentSchema = z.object({
  organizationName: z.string(),
  ticketReference: z.number().int(),
  method: PaymentMethodSchema,
  /** `EXPIRED` is derived: still `PENDING` but past `expiresAt`. */
  status: z.enum([...PaymentStatusSchema.options, "EXPIRED"]),
  amountMinor: z.number().int(),
  currency: z.string(),
  paymentUrl: z.string().nullable(),
  expiresAt: z.date().nullable(),
  paidAt: z.date().nullable(),
});

export type PublicPaymentDto = z.infer<typeof PublicPaymentSchema>;
