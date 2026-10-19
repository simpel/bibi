import { z } from "zod";

/** Where a line's quantity comes from (ADR 0052): its own, else the ticket's headcount. */
export const QuantitySourceSchema = z.enum(["LINE", "GUARANTEED_HEADCOUNT", "ESTIMATED_HEADCOUNT"]);
/** Where a line's unit price comes from: its override, the customer's price list, the item. */
export const PriceSourceSchema = z.enum(["LINE", "PRICE_LIST", "ITEM"]);
/** Where a line's discount comes from: its override or the customer's price list. */
export const DiscountSourceSchema = z.enum(["LINE", "PRICE_LIST"]);
/** Where a line's VAT rate comes from: its override, the item, the venue's default. */
export const VatSourceSchema = z.enum(["LINE", "ITEM", "VENUE"]);

const inherited = "Any source other than LINE is inherited; null = none";

/**
 * The derived commercial values of a line (ADR 0052). They are never stored: a changed price
 * list, item or headcount shows on the line at once.
 */
export const LineEffectiveShape = {
  effectiveQuantity: z
    .number()
    .int()
    .nullable()
    .describe("The quantity in effect: the line's own, else the ticket's headcount"),
  quantitySource: QuantitySourceSchema.nullable().describe(inherited),
  effectiveUnitPriceMinor: z
    .number()
    .int()
    .nullable()
    .describe("Unit price in effect, minor units: line → customer price list → item"),
  unitPriceSource: PriceSourceSchema.nullable().describe(inherited),
  effectiveDiscountPercent: z
    .number()
    .describe("Discount in effect, percent: line → customer price list; 0 when none"),
  discountSource: DiscountSourceSchema.nullable().describe(inherited),
  effectiveVatRatePercent: z
    .number()
    .int()
    .nullable()
    .describe("VAT rate in effect, percent: line → item → venue default"),
  vatRateSource: VatSourceSchema.nullable().describe(inherited),
};

export type LineEffective = {
  [K in keyof typeof LineEffectiveShape]: z.infer<(typeof LineEffectiveShape)[K]>;
};
export type QuantitySource = z.infer<typeof QuantitySourceSchema>;
export type PriceSource = z.infer<typeof PriceSourceSchema>;
export type DiscountSource = z.infer<typeof DiscountSourceSchema>;
export type VatSource = z.infer<typeof VatSourceSchema>;
