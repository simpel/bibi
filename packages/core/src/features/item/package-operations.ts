import { defineOperation } from "../../operations/define-operation";
import { checkCustomer } from "../booking/booking-rules";
import { itemEmbeddable } from "./embeddable";
import { insertItem } from "./insert-item";
import { ItemSaveAsPackageInputSchema } from "./package-schema";
import { ItemSchema } from "./schema";

export const saveItemAsPackage = defineOperation({
  name: "item.saveAsPackage",
  kind: "command",
  description:
    "Save a set of items as a package for one customer (ADR 0021): creates a customer-specific " +
    "item of a COMPOSABLE type with the given parts and, optionally, the package's own price. " +
    "The package is listed only with its customer (item.list with customerId); the catalog is " +
    "unchanged. Parts are catalog items or the customer's own packages.",
  input: ItemSaveAsPackageInputSchema,
  output: ItemSchema,
  permission: "item:write",
  embeddable: itemEmbeddable,
  handler: async ({ input: { customerId, ...input }, context }) => {
    const customer = await checkCustomer({ context, customerId });
    if (!customer.ok) return customer;
    return insertItem({ context, input, customerId });
  },
});
