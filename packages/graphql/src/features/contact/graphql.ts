import {
  archiveContact,
  type ContactDto,
  ContactSchema,
  createContact,
  getContact,
  listContacts,
  updateContact,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { CustomerRef } from "../customer/graphql";
import { EntityTypeRef } from "../entity-type/graphql";

export const ContactRef = objectFromSchema<ContactDto>({
  name: "Contact",
  schema: ContactSchema,
  omit: ["organizationId"],
  description: "Contact – a person at a customer: orderer, invoice recipient or organizer.",
});
const ContactPageRef = pageType({ name: "ContactPage", item: ContactRef });

fieldFromOperation({ operation: listContacts, type: ContactPageRef, name: "contacts" });
fieldFromOperation({ operation: getContact, type: ContactRef, name: "contact" });
mutationFromOperation({ operation: createContact, type: ContactRef });
mutationFromOperation({ operation: updateContact, type: ContactRef });
mutationFromOperation({ operation: archiveContact, type: ContactRef });

// Graph edges. They live here so that customer/graphql.ts does not need to import this file.
builder.objectField(CustomerRef, "contacts", (t) =>
  t.field({
    type: [ContactRef],
    description: "Active contact persons at the customer, ordered by name.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (customer, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listContacts,
        input: { customerId: customer.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: ContactDto[] };
      return page.items;
    },
  }),
);

builder.objectField(ContactRef, "customer", (t) =>
  t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer the person works for (null if archived).",
    resolve: (contact, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:read" });
      return ctx.loaders.customer.load({ id: contact.customerId });
    },
  }),
);

builder.objectField(ContactRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The contact type, with its fields.",
    resolve: (contact, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: contact.entityTypeId }) as never;
    },
  }),
);
