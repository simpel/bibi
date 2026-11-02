import { z } from "zod";
import { LineRoleSchema } from "../line/line-role";

/**
 * One line of the quote or invoice a public payment settles, as the customer received it: a copy
 * of its frozen order line (ADR 0052) without ids, item, tags or anything internal.
 */
export const PublicPaymentLineSchema = z.object({
  name: z.string(),
  quantity: z.number().int(),
  unitPriceMinor: z.number().int().describe("Price per unit in minor units"),
  discountPercent: z.number(),
  vatRatePercent: z.number().int(),
  totalExclVatMinor: z.number().int().describe("quantity × unit price − discount, minor units"),
  role: LineRoleSchema.nullable().describe("PART, OPTION or ADD_ON on a sub-line (ADR 0088)"),
  subLine: z
    .boolean()
    .describe("Shown indented under the line before it: its parent is on the same document"),
  inTotal: z.boolean().describe("Counts in the document's totals (a part never does)"),
});

/** The document's stored totals; `totalIsFrom` while an alternative group is unchosen. */
export const PublicPaymentTotalsSchema = z.object({
  totalExclVatMinor: z.number().int(),
  vatMinor: z.number().int(),
  totalInclVatMinor: z.number().int(),
  totalIsFrom: z.boolean(),
  deductions: z
    .array(z.object({ description: z.string(), amountMinor: z.number().int() }))
    .describe("Paid deposits an invoice deducts (ADR 0090); empty for a quote"),
  amountDueMinor: z.number().int().describe("Total incl. VAT less the deductions"),
});

export type PublicPaymentLine = z.infer<typeof PublicPaymentLineSchema>;
export type PublicPaymentTotals = z.infer<typeof PublicPaymentTotalsSchema>;
