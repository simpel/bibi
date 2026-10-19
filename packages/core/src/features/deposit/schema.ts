import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { PAYMENT_AMOUNT_MAX_MINOR } from "../payment/schema";
import { ReceivableStatusSchema, SettlementShape } from "../payment/settlement-schema";

/**
 * A deposit request (ADR 0057): a frozen receivable with a fixed amount and its own description.
 * `status` holds only its lifecycle; what is paid is derived from its payments.
 */
export const DepositSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ticketId: z.string(),
  description: z.string().describe("What the customer pays for"),
  amountMinor: z.number().int().describe("Fixed amount in minor units (öre for SEK)"),
  currency: z.string(),
  dueDate: z.date().nullable(),
  status: ReceivableStatusSchema.describe("DRAFT, SENT (payments can be requested) or VOID"),
  statusChangedAt: z.date(),
  ...SettlementShape,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const DepositListInputSchema = z.object({
  ...PageInputShape,
  ticketId: z.string().min(1).describe("Id of the ticket whose deposit requests to list"),
});

export const DepositListOutputSchema = z.object({
  items: z.array(DepositSchema),
  nextCursor: z.string().nullable(),
});

export const DepositIdInputSchema = z.object({ id: z.string().min(1) });

export const DepositCreateInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket the deposit is requested for"),
  description: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .describe("What the customer pays for, shown on the payment"),
  amountMinor: z
    .number()
    .int()
    .min(100)
    .max(PAYMENT_AMOUNT_MAX_MINOR)
    .describe("Fixed amount in minor units (öre for SEK), at least 100"),
  dueDate: z.coerce.date().nullish().describe("When the deposit is due, ISO 8601"),
});

export type DepositDto = z.infer<typeof DepositSchema>;
export type DepositPage = z.infer<typeof DepositListOutputSchema>;
export type DepositCreateInput = z.infer<typeof DepositCreateInputSchema>;
export type DepositIdInput = z.infer<typeof DepositIdInputSchema>;
