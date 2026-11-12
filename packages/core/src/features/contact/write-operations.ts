import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { LinkValue } from "../../records/record-links";
import { archiveRecords, updateRecord } from "../../records/update-record";
import { invalid, notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { checkNotLinked } from "../field-definition/link-usage";
import { contactEmbeddable } from "./embeddable";
import { insertContact } from "./insert-contact";
import {
  ContactCreateInputSchema,
  ContactIdInputSchema,
  ContactSchema,
  ContactUpdateInputSchema,
} from "./schema";
import { CONTACT_INCLUDE, loadContact, toContactDto } from "./to-contact-dto";

const unknownCustomer = () =>
  invalid({
    message: "Unknown customer",
    issues: [{ path: "customerId", message: "Unknown customer" }],
  });

export const createContact = defineOperation({
  name: "contact.create",
  kind: "command",
  description:
    "Create a contact person at an active customer, with one of the organization's contact " +
    "types. `fields` must match the type's own fields (e.g. the person's role). " +
    "`buyerReference` is the reference this person orders under; their orders inherit it.",
  input: ContactCreateInputSchema,
  output: ContactSchema,
  permission: "customer:write",
  embeddable: contactEmbeddable,
  handler: async ({ input: { customerId, ...input }, context }) => {
    if (!(await context.db.customer.findFirst({ where: { id: customerId } }))) {
      return unknownCustomer();
    }
    const contact = await insertContact({ context, customerId, contact: input });
    if (!contact.ok) return contact;
    context.recordChange({ entityId: contact.value.id, after: contact.value });
    return contact;
  },
});

export const updateContact = defineOperation({
  name: "contact.update",
  kind: "command",
  description:
    "Update a contact person. Omitted properties are unchanged; `fields` is merged by key " +
    "(null clears a value). The customer and the type cannot be changed.",
  input: ContactUpdateInputSchema,
  output: ContactSchema,
  permission: "customer:write",
  embeddable: contactEmbeddable,
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadContact({ context, id });
    if (!before) return notFound({ entity: "Contact" });
    let json: ReturnType<typeof toJson>;
    let links: LinkValue[] | undefined;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const { entityTypeId } = before;
      const checked = await validateFields({ context, entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value.fields });
      links = checked.value.links;
    }
    await updateRecord({ context, id, change: { fields: json, links } });
    const row = await context.db.contact.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
      include: CONTACT_INCLUDE,
    });
    const contact = toContactDto({ row });
    context.recordChange({ entityId: id, before, after: contact });
    return ok({ value: contact });
  },
});

export const archiveContact = defineOperation({
  name: "contact.archive",
  kind: "command",
  description:
    "Archive (soft-delete) a contact person. Archived contacts are hidden from lists. Refused " +
    "while another record's LINK field points to it.",
  input: ContactIdInputSchema,
  output: ContactSchema,
  permission: "customer:delete",
  embeddable: contactEmbeddable,
  handler: async ({ input: { id }, context }) => {
    const before = await loadContact({ context, id });
    if (!before) return notFound({ entity: "Contact" });
    const records = [{ id, entityTypeId: before.entityTypeId }];
    const linked = await checkNotLinked({ context, records, what: before.name });
    if (!linked.ok) return linked;
    const row = await context.db.contact.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: CONTACT_INCLUDE,
    });
    await archiveRecords({ context, ids: [id] });
    const contact = toContactDto({ row });
    context.recordChange({ entityId: id, before, after: contact });
    return ok({ value: contact });
  },
});
