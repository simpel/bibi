import {
  archiveCustomer,
  type CustomerDto,
  type CustomerFindSimilar,
  CustomerFindSimilarOutputSchema,
  CustomerSchema,
  createCustomer,
  findSimilarCustomers,
  getCustomer,
  type ItemDto,
  listCustomers,
  listItems,
  type SimilarCustomer,
  SimilarCustomerSchema,
  updateCustomer,
} from "@bibi/core";
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

const SimilarCustomerRef = objectFromSchema<SimilarCustomer>({
  name: "SimilarCustomer",
  schema: SimilarCustomerSchema,
  omit: ["customer"],
  description: "A customer that may be the one about to be created, and why (ADR 0081).",
});
builder.objectField(SimilarCustomerRef, "customer", (t) =>
  t.field({ type: CustomerRef, resolve: (match) => match.customer }),
);
const SimilarCustomersRef = objectFromSchema<CustomerFindSimilar>({
  name: "SimilarCustomers",
  schema: CustomerFindSimilarOutputSchema,
  omit: ["items"],
  description: "Possible duplicates of a new customer, strongest match first.",
});
builder.objectField(SimilarCustomersRef, "items", (t) =>
  t.field({ type: [SimilarCustomerRef], resolve: (result) => result.items }),
);
fieldFromOperation({
  operation: findSimilarCustomers,
  type: SimilarCustomersRef,
  name: "similarCustomers",
});
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

// Customer-specific bundles (ADR 0021). They live here so item/graphql.ts stays catalog-only.
builder.objectField(CustomerRef, "bundles", (t) =>
  t.field({
    type: [ItemRef],
    description: "The customer's own bundles (customer-specific items), ordered by name.",
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
    description: "The customer a bundle belongs to (null for catalog items or if archived).",
    resolve: (item, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:read" });
      return item.customerId ? ctx.loaders.customer.load({ id: item.customerId }) : null;
    },
  }),
);
