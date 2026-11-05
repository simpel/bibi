import { z } from "zod";
import { SettlementShape } from "./settlement-schema";

export const RECEIVABLE_KINDS = ["QUOTE", "DEPOSIT", "INVOICE"] as const;
export const ReceivableKindSchema = z.enum(RECEIVABLE_KINDS);

/** One receivable on the order with what is paid against it (derived, ADR 0057). */
export const ReceivableSettlementSchema = z.object({
  kind: ReceivableKindSchema,
  id: z
    .string()
    .describe("Id of the quote, deposit or invoice (quote.get, deposit.get, invoice.get)"),
  amountMinor: z.number().int().describe("Its fixed amount in minor units"),
  ...SettlementShape,
});

/** What an order owes, all derived from receivables and payments; nothing is stored. */
export const OrderBalanceSchema = z.object({
  orderId: z.string(),
  currency: z.string(),
  billedFrom: z
    .enum(["INVOICE", "QUOTE", "NONE"])
    .describe("SENT invoices once invoiced, else the ACCEPTED quote, else nothing"),
  billedMinor: z.number().int().describe("What the customer owes in total, minor units"),
  paidMinor: z.number().int().describe("SUCCEEDED payments minus refunds on the order"),
  balanceMinor: z.number().int().describe("billed minus paid; negative when paid in advance"),
  receivables: z.array(ReceivableSettlementSchema),
});

export const OrderBalanceInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order whose balance to derive"),
});

export type ReceivableKind = z.infer<typeof ReceivableKindSchema>;
export type ReceivableSettlement = z.infer<typeof ReceivableSettlementSchema>;
export type OrderBalanceDto = z.infer<typeof OrderBalanceSchema>;
export type OrderBalanceInput = z.infer<typeof OrderBalanceInputSchema>;
