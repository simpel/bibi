import { z } from "zod";
import { PROVIDER_KEYS } from "./provider-keys";

export const SIGNAL_KINDS = [
  "attempt.succeeded",
  "attempt.failed",
  "attempt.expired",
  "attempt.cancelled",
  "refund.succeeded",
  "refund.failed",
  "invoice.payment_recorded",
  "invoice.payment_removed",
  "invoice.voided",
  "invoice.credited",
  "connection.status",
] as const;

/**
 * Every inbound provider change, normalized (ADR 0100). A provider's webhook, stream or poll turns
 * its own events into these; core applies them as SYSTEM. `externalAccountId` finds the
 * organization; `reference` is the provider's id of the attempt, refund or invoice.
 */
export const ProviderSignalSchema = z.object({
  provider: z.enum(PROVIDER_KEYS),
  eventId: z.string().min(1).describe("The provider's event id; the dedupe key"),
  kind: z.enum(SIGNAL_KINDS),
  externalAccountId: z.string().min(1).nullable().describe("The account the event happened on"),
  reference: z.string().min(1).optional().describe("The attempt's or invoice's provider id"),
  paymentId: z.string().min(1).optional().describe("Bibi payment id from the provider metadata"),
  amountMinor: z.number().int().optional(),
  refundedTotalMinor: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Total refunded so far, for providers that report totals (Stripe)"),
  occurredAt: z.date(),
});

export type ProviderSignal = z.infer<typeof ProviderSignalSchema>;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
