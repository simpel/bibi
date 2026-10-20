import { defineOperation } from "../../operations/define-operation";
import { checkCustomer } from "../ticket/ticket-rules";
import { ItemSaveAsBundleInputSchema } from "./bundle-schema";
import { itemEmbeddable } from "./embeddable";
import { insertItem } from "./insert-item";
import { ItemSchema } from "./schema";

export const saveItemAsBundle = defineOperation({
  name: "item.saveAsBundle",
  kind: "command",
  description:
    "Save a set of items as a bundle for one customer (ADR 0021): creates a customer-specific " +
    "item of a BUNDLE type with the given parts and, optionally, the bundle's own price. " +
    "The bundle is listed only with its customer (item.list with customerId); the catalog is " +
    "unchanged. Parts are catalog items or the customer's own bundles.",
  input: ItemSaveAsBundleInputSchema,
  output: ItemSchema,
  permission: "item:write",
  embeddable: itemEmbeddable,
  handler: async ({ input: { customerId, ...input }, context }) => {
    const customer = await checkCustomer({ context, customerId });
    if (!customer.ok) return customer;
    return insertItem({ context, input, customerId });
  },
});
