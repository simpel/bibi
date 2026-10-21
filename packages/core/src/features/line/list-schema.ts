import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { LineSchema } from "./schema";

export const LineListInputSchema = z.object({
  ticketId: z.string().optional().describe("Only the program of this ticket"),
  itemId: z.string().optional().describe("Only lines held in this item"),
  stateId: z.string().optional().describe("Only lines in this item state (itemState.list)"),
  parentLineId: z.string().optional().describe("Only the part lines of this bundle line"),
  from: z.coerce.date().optional().describe("Only lines that end after this time"),
  to: z.coerce.date().optional().describe("Only lines that start before this time"),
  ...PageInputShape,
});

export const LineListOutputSchema = z.object({
  items: z.array(LineSchema),
  nextCursor: z.string().nullable(),
});
