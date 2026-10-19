import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { createRecord } from "../../records/create-record";
import { archiveRecords, updateRecord } from "../../records/update-record";
import { invalid, notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { checkNotLinked } from "../field-definition/link-usage";
import { contactEmbeddable } from "./embeddable";
import {
  ContactCreateInputSchema,
  ContactIdInputSchema,
  ContactSchema,
  ContactUpdateInputSchema,
} from "./schema";
import { loadContact, toContactDto } from "./to-contact-dto";

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
    "types. `fields` must match the type's own fields (e.g. the person's role).",
  input: ContactCreateInputSchema,
  output: ContactSchema,
  permission: "contact:write",
  embeddable: contactEmbeddable,
  handler: async ({ input: { entityTypeId, customerId, fields, ...data }, context }) => {
    if (!(await context.db.customer.findFirst({ where: { id: customerId } }))) {
      return unknownCustomer();
    }
    const type = await loadTypeOfBase({ context, entityTypeId, base: "CONTACT" });
    if (!type.ok) return type;
    const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
    if (!checked.ok) return checked;
    const row = await createRecord({
      context,
      base: "CONTACT",
      entityTypeId,
      fields: checked.value,
      insert: ({ id }) =>
        context.db.contact.create({
          data: {
            id,
            ...data,
            entityTypeId,
            customerId,
            fields: toJson({ value: checked.value }) ?? {},
            organizationId: context.organizationId,
          },
        }),
    });
    const contact = toContactDto({ row });
    context.recordChange({ entityId: row.id, after: contact });
    return ok({ value: contact });
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
  permission: "contact:write",
  embeddable: contactEmbeddable,
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadContact({ context, id });
    if (!before) return notFound({ entity: "Contact" });
    let json: ReturnType<typeof toJson>;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const { entityTypeId } = before;
      const checked = await validateFields({ context, entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value });
    }
    const row = await context.db.contact.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
    });
    await updateRecord({ context, id, change: { fields: json } });
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
  permission: "contact:write",
  embeddable: contactEmbeddable,
  handler: async ({ input: { id }, context }) => {
    const before = await loadContact({ context, id });
    if (!before) return notFound({ entity: "Contact" });
    const records = [{ id, entityTypeId: before.entityTypeId }];
    const linked = await checkNotLinked({ context, records, what: before.name });
    if (!linked.ok) return linked;
    const row = await context.db.contact.update({ where: { id }, data: { status: "ARCHIVED" } });
    await archiveRecords({ context, ids: [id] });
    const contact = toContactDto({ row });
    context.recordChange({ entityId: id, before, after: contact });
    return ok({ value: contact });
  },
});
