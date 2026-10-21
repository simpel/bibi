import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { ItemCapabilitySchema } from "../entity-type/capability-kinds";
import { ItemSchema } from "./schema";

export const ItemListInputSchema = z.object({
  entityTypeId: z.string().optional().describe("Only items of this type"),
  venueId: z.string().optional().describe("Only items in this venue"),
  capability: ItemCapabilitySchema.optional().describe("Only items whose type has this capability"),
  customerId: z
    .string()
    .optional()
    .describe("Also list this customer's own bundles. Without it, only the catalog is listed."),
  onlyCustomer: z
    .boolean()
    .optional()
    .describe("With customerId: only that customer's bundles, without the catalog"),
  ...PageInputShape,
});

export const ItemListOutputSchema = z.object({
  items: z.array(ItemSchema),
  nextCursor: z.string().nullable(),
});
