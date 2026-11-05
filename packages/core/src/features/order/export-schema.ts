import { z } from "zod";

/** Formats of `order.export` (ADR 0024); csv and pdf follow with the export order (#63). */
export const ORDER_EXPORT_FORMATS = ["json"] as const;

export const OrderExportInputSchema = z.object({
  id: z.string().min(1).describe("Id of the order"),
  format: z.enum(ORDER_EXPORT_FORMATS).default("json").describe("json: a versioned document"),
});

export const OrderExportOutputSchema = z.object({
  filename: z.string(),
  mime: z.string(),
  size: z.number().int().describe("Size of the content in bytes"),
  content: z.string().describe("The exported document"),
});

export type OrderExport = z.infer<typeof OrderExportOutputSchema>;
