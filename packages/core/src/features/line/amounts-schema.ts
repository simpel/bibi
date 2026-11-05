import { z } from "zod";

export const LineAmountsInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order (order.list) whose lines to price"),
});

export const LineAmountSchema = z.object({
  lineId: z.string().describe("The line (line.list)"),
  totalExclVatMinor: z
    .number()
    .int()
    .describe("What the line costs: quantity × unit price less the discount, excl. VAT"),
  vatMinor: z.number().int().describe("The VAT on it"),
  inTotal: z
    .boolean()
    .describe(
      "Whether it counts in the order's total (ADR 0052, 0059, 0082, 0088): false for a " +
        "bundle's part, an INCLUDED option, a parent covered by its REPLACES options and an " +
        "unchosen alternative with its options and add-ons",
    ),
});

export const LineAmountsOutputSchema = z.object({
  lines: z
    .array(LineAmountSchema)
    .describe("Every priced active line of the order, in time order; unpriced lines are left out"),
  totalExclVatMinor: z.number().int().describe("The sum of the lines that count, excl. VAT"),
  totalInclVatMinor: z.number().int().describe("The same with VAT"),
  totalIsFrom: z
    .boolean()
    .describe("True while some alternative group is not chosen: the totals are a 'from' price"),
});

export type LineAmountsInput = z.infer<typeof LineAmountsInputSchema>;
export type LineAmount = z.infer<typeof LineAmountSchema>;
export type LineAmounts = z.infer<typeof LineAmountsOutputSchema>;
