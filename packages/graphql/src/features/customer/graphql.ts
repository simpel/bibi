import {
  archiveCustomer,
  type CustomerDto,
  CustomerSchema,
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { EntityTypeRef } from "../entity-type/graphql";

export const CustomerRef = objectFromSchema<CustomerDto>({
  name: "Customer",
  schema: CustomerSchema,
  omit: ["organizationId"],
  description:
    "Customer – the company, agency, association or person that buys, as defined by its type.",
});
const CustomerPageRef = pageType({ name: "CustomerPage", item: CustomerRef });

fieldFromOperation({ operation: listCustomers, type: CustomerPageRef, name: "customers" });
fieldFromOperation({ operation: getCustomer, type: CustomerRef, name: "customer" });
mutationFromOperation({ operation: createCustomer, type: CustomerRef });
mutationFromOperation({ operation: updateCustomer, type: CustomerRef });
mutationFromOperation({ operation: archiveCustomer, type: CustomerRef });

builder.objectField(CustomerRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The customer type, with its fields.",
    resolve: (customer, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: customer.entityTypeId }) as never;
    },
  }),
);
