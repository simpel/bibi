import {
  archiveCustomer,
  type CustomerDto,
  CustomerSchema,
  createCustomer,
  getCustomer,
  type ItemDto,
  listCustomers,
  listItems,
  updateCustomer,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { EntityTypeRef } from "../entity-type/graphql";
import { ItemRef } from "../item/graphql";

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
      requirePermission({ ctx, permission: "configuration:view" });
      return ctx.loaders.entityType.load({ id: customer.entityTypeId }) as never;
    },
  }),
);

// Customer-specific packages (ADR 0021). They live here so item/graphql.ts stays catalog-only.
builder.objectField(CustomerRef, "packages", (t) =>
  t.field({
    type: [ItemRef],
    description: "The customer's own packages (customer-specific items), ordered by name.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (customer, { limit }, ctx) => {
      const input = { customerId: customer.id, onlyCustomer: true };
      const page = (await runOperation({
        operation: listItems,
        input: { ...input, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: ItemDto[] };
      return page.items;
    },
  }),
);

builder.objectField(ItemRef, "customer", (t) =>
  t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer a package belongs to (null for catalog items or if archived).",
    resolve: (item, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:view" });
      return item.customerId ? ctx.loaders.customer.load({ id: item.customerId }) : null;
    },
  }),
);
