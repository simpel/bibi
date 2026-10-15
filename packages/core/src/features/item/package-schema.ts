import { z } from "zod";
import { ItemCreateInputSchema } from "./schema";

/**
 * "Save as package" (ADR 0021): a COMPOSABLE item owned by one customer, assembled from catalog
 * items or the customer's own packages. Listed only with that customer.
 */
export const ItemSaveAsPackageInputSchema = ItemCreateInputSchema.extend({
  customerId: z.string().min(1).describe("The customer the package belongs to"),
  entityTypeId: ItemCreateInputSchema.shape.entityTypeId.describe(
    "Id of a COMPOSABLE item type (entityType.list base ITEM)",
  ),
  components: ItemCreateInputSchema.shape.components
    .unwrap()
    .min(1)
    .describe(
      "The package's parts: catalog items or this customer's own packages. At least one part.",
    ),
});

export type ItemSaveAsPackageInput = z.infer<typeof ItemSaveAsPackageInputSchema>;
