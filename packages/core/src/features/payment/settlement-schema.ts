import { z } from "zod";

/** Lifecycle of a deposit request or an invoice (ADR 0057): owned facts only. */
export const RECEIVABLE_STATUSES = ["DRAFT", "SENT", "VOID"] as const;
export const ReceivableStatusSchema = z.enum(RECEIVABLE_STATUSES);

/** How far a receivable is paid; always derived from its payments, never stored (ADR 0057). */
export const RECEIVABLE_PROGRESS = ["OPEN", "PARTLY_PAID", "PAID", "OVERPAID"] as const;
export const ReceivableProgressSchema = z.enum(RECEIVABLE_PROGRESS);

/** The derived money fields every receivable DTO carries. */
export const SettlementShape = {
  paidMinor: z
    .number()
    .int()
    .describe("Derived: SUCCEEDED payments minus refunds against it, minor units"),
  openMinor: z.number().int().describe("Derived: amount minus paid (negative when overpaid)"),
  progress: ReceivableProgressSchema.describe("Derived: OPEN, PARTLY_PAID, PAID or OVERPAID"),
};

export type ReceivableStatus = z.infer<typeof ReceivableStatusSchema>;
export type ReceivableProgress = z.infer<typeof ReceivableProgressSchema>;
