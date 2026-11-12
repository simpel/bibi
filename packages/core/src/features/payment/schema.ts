import { z } from "zod";
import { PAYMENT_METHODS, PROVIDER_KEYS } from "../../providers/provider-keys";
import { PageInputShape } from "../../shared/page-input";
import { PublicPaymentLineSchema, PublicPaymentTotalsSchema } from "./public-document-schema";
import { PublicTokenSchema } from "./public-token";

export const PaymentMethodSchema = z
  .enum(PAYMENT_METHODS)
  .describe("CARD, SWISH, INVOICE (paid against an invoice) or MANUAL (recorded by staff)");
/** The methods a customer pays a requested payment with at a provider (ADR 0100). */
export const PaymentCreateMethodSchema = z.enum(["CARD", "SWISH"]);
export const PaymentStatusSchema = z.enum([
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]);

/** One refund of a payment (ADR 0100): PENDING until the provider confirms it. */
export const PaymentRefundSchema = z.object({
  id: z.string(),
  amountMinor: z.number().int().describe("This refund in minor units"),
  status: z.enum(["PENDING", "SUCCEEDED", "FAILED"]),
  refundedAt: z.date().nullable().describe("When the provider confirmed it; null until then"),
  createdAt: z.date(),
});

/** A payment requested from the customer that settles one receivable (ADR 0028, 0029, 0057). */
export const PaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderId: z.string(),
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
    .describe("Bibi's application fee on this charge in minor units, agreed at charge time"),
  provider: z
    .enum(PROVIDER_KEYS)
    .nullable()
    .describe(
      "Where it was paid: the provider Bibi asked (a card charge), or the provider whose invoice " +
        "it was booked on; null when no provider took it",
    ),
  providerReference: z
    .string()
    .nullable()
    .describe("The latest attempt's provider id; null until the provider has created it"),
  paymentUrl: z.string().nullable().describe("Hosted checkout or invoice page for the customer"),
  expiresAt: z.date().nullable().describe("When the latest attempt stops accepting payment"),
  paidAt: z.date().nullable(),
  note: z.string().nullable().describe("Staff's note on a payment they recorded (MANUAL)"),
  refundedMinor: z
    .number()
    .int()
    .describe("Refunded so far, minor units: the sum of its succeeded refunds (derived)"),
  refundableMinor: z
    .number()
    .int()
    .describe("What payment.refund may still refund, minor units; 0 unless SUCCEEDED"),
  refunds: z
    .array(PaymentRefundSchema)
    .describe("Its refunds, oldest first, the ones the provider made on its own included"),
  canRefund: z
    .boolean()
    .describe(
      "payment.refund can run: SUCCEEDED with money left to refund, taken by a provider that " +
        "refunds (or recorded by staff)",
    ),
  canCancel: z.boolean().describe("payment.cancel can run: still PENDING"),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const PaymentListInputSchema = z.object({
  ...PageInputShape,
  orderId: z.string().min(1).describe("Id of the order whose payments to list"),
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

/**
 * Exactly one of `depositId` and `invoiceId` (checked by the handler). A quote is not paid
 * directly (ADR 0106): accepting it leads to its deposit.
 */
export const PaymentCreateInputSchema = z.object({
  depositId: receivableId({ what: "SENT deposit request (deposit.list)" }),
  invoiceId: receivableId({ what: "SENT invoice (invoice.list)" }),
  method: PaymentCreateMethodSchema.optional().describe(
    "The method to prepare first: CARD (a hosted checkout link) or SWISH. Defaults to CARD when " +
      "it is routed, else the first routed method. The customer may pay with any routed method " +
      "on the payment page. Invoices are raised with invoice.send, not here.",
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
export type PaymentCreateMethod = z.infer<typeof PaymentCreateMethodSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentDto = z.infer<typeof PaymentSchema>;
export type PaymentPage = z.infer<typeof PaymentListOutputSchema>;
export type PaymentCreateInput = z.infer<typeof PaymentCreateInputSchema>;

export const PublicPaymentInputSchema = z.object({
  token: PublicTokenSchema.describe("Token from the public payment page URL"),
});

/** What the customer sees on the public page: no customer or order details (ADR 0028). */
export const PublicPaymentSchema = z.object({
  organizationName: z.string(),
  orderReference: z.number().int(),
  method: PaymentMethodSchema,
  methods: z
    .array(PaymentMethodSchema)
    .describe("The methods the customer can pay with now (routed, ADR 0100); [] once settled"),
  /** `EXPIRED` is derived: still `PENDING` but past `expiresAt`. */
  status: z.enum([...PaymentStatusSchema.options, "EXPIRED"]),
  amountMinor: z.number().int(),
  currency: z.string(),
  paymentUrl: z.string().nullable(),
  expiresAt: z.date().nullable(),
  paidAt: z.date().nullable(),
  lines: z
    .array(PublicPaymentLineSchema)
    .describe("The paid quote's or invoice's frozen lines, sub-lines after their parent; [] else"),
  totals: PublicPaymentTotalsSchema.nullable().describe("That document's totals; null without one"),
});

export type PublicPaymentDto = z.infer<typeof PublicPaymentSchema>;
