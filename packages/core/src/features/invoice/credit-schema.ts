import { z } from "zod";
import { PAYMENT_AMOUNT_MAX_MINOR } from "../payment/schema";

/** Give `lineIds` or `amountMinor`, or neither for everything still due (checked by the handler). */
export const InvoiceCreditInputSchema = z.object({
  invoiceId: z.string().min(1).describe("Id of the SENT invoice to credit"),
  lineIds: z
    .array(z.string().min(1))
    .min(1)
    .max(500)
    .optional()
    .describe("Ids of the invoice's frozen lines (invoice.get lines) to credit in full"),
  amountMinor: z
    .number()
    .int()
    .min(1)
    .max(PAYMENT_AMOUNT_MAX_MINOR)
    .optional()
    .describe("Credit this amount incl. VAT, minor units, spread over the invoice's VAT rates"),
  reason: z.string().trim().min(1).max(500).optional().describe("Why, shown on the credit note"),
});

export type InvoiceCreditInput = z.infer<typeof InvoiceCreditInputSchema>;
