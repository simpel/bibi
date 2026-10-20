import { z } from "zod";
import { ItemCreateInputSchema } from "./schema";

/**
 * "Save as bundle" (ADR 0021): a BUNDLE item owned by one customer, assembled from catalog
 * items or the customer's own bundles. Listed only with that customer.
 */
export const ItemSaveAsBundleInputSchema = ItemCreateInputSchema.extend({
  customerId: z.string().min(1).describe("The customer the bundle belongs to"),
  entityTypeId: ItemCreateInputSchema.shape.entityTypeId.describe(
    "Id of a BUNDLE item type (entityType.list base ITEM)",
  ),
  parts: ItemCreateInputSchema.shape.parts
    .unwrap()
    .min(1)
    .describe(
      "The bundle's parts: catalog items or this customer's own bundles. At least one part.",
    ),
});

export type ItemSaveAsBundleInput = z.infer<typeof ItemSaveAsBundleInputSchema>;
