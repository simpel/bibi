import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { LineSchema } from "./schema";

export const LineListInputSchema = z.object({
  orderId: z.string().optional().describe("Only the program of this order"),
  itemId: z.string().optional().describe("Only lines held in this item"),
  stateId: z.string().optional().describe("Only lines in this item state (itemState.list)"),
  parentLineId: z
    .string()
    .optional()
    .describe("Only the sub-lines (parts, options, add-ons) of this line"),
  from: z.coerce.date().optional().describe("Only lines that end after this time"),
  to: z.coerce.date().optional().describe("Only lines that start before this time"),
  ...PageInputShape,
});

export const LineListOutputSchema = z.object({
  items: z.array(LineSchema),
  nextCursor: z.string().nullable(),
});
