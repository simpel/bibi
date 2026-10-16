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

/** A payment requested from the customer for a booking (ADR 0028, 0029). */
export const PaymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  bookingId: z.string(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  amountMinor: z.number().int().describe("Amount in minor units (öre for SEK)"),
  currency: z.string(),
  applicationFeeMinor: z.number().int().nullable(),
  providerReference: z.string().describe("Stripe Checkout Session or Invoice id"),
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
  bookingId: z.string().min(1).describe("Id of the booking whose payments to list"),
});

export const PaymentListOutputSchema = z.object({
  items: z.array(PaymentSchema),
  nextCursor: z.string().nullable(),
});

export const PaymentIdInputSchema = z.object({ id: z.string().min(1) });

/** Largest amount one payment may request (minor units), a guard against typos. */
export const PAYMENT_AMOUNT_MAX_MINOR = 1_000_000_000;

export const PaymentCreateInputSchema = z.object({
  bookingId: z.string().min(1).describe("Id of the booking the customer pays for"),
  method: PaymentMethodSchema.describe(
    "CARD: a hosted card checkout link. INVOICE: a Stripe invoice emailed to the customer.",
  ),
  amountMinor: z
    .number()
    .int()
    .min(100)
    .max(PAYMENT_AMOUNT_MAX_MINOR)
    .describe("Amount in minor units (öre for SEK), at least 100"),
  currency: z
    .string()
    .regex(/^[A-Za-z]{3}$/)
    .toUpperCase()
    .default("SEK")
    .describe("ISO 4217 currency code"),
  description: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe(
      "Text the customer sees on the checkout or invoice line; defaults to the booking reference",
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

/** What the customer sees on the public page: no customer or booking details (ADR 0028). */
export const PublicPaymentSchema = z.object({
  organizationName: z.string(),
  bookingReference: z.number().int(),
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
