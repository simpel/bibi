import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  ContactIdInputSchema,
  ContactListInputSchema,
  ContactListOutputSchema,
  ContactSchema,
} from "./schema";
import { CONTACT_INCLUDE, loadContact, toContactDto } from "./to-contact-dto";
import { archiveContact, createContact, updateContact } from "./write-operations";

export const listContacts = defineOperation({
  name: "contact.list",
  kind: "query",
  description:
    "List contact persons: the people at customers who order, receive invoices or organize. " +
    "Filter by customer, contact type or part of the name.",
  input: ContactListInputSchema,
  output: ContactListOutputSchema,
  permission: "customer:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.contact.findMany({
      where: {
        ...(input.customerId ? { customerId: input.customerId } : {}),
        ...(input.entityTypeId ? { entityTypeId: input.entityTypeId } : {}),
        ...(input.query ? { name: { contains: input.query, mode: "insensitive" as const } } : {}),
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: CONTACT_INCLUDE,
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toContactDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getContact = defineOperation({
  name: "contact.get",
  kind: "query",
  description: "Get one contact person by id, with the type's field values.",
  input: ContactIdInputSchema,
  output: ContactSchema,
  permission: "customer:read",
  handler: async ({ input, context }) => {
    const contact = await loadContact({ context, id: input.id });
    return contact ? ok({ value: contact }) : notFound({ entity: "Contact" });
  },
});

export const contactOperations = [
  listContacts,
  getContact,
  createContact,
  updateContact,
  archiveContact,
];
