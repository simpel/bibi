import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { createRecord } from "../../records/create-record";
import type { LinkValue } from "../../records/record-links";
import { updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { customerEmbeddable } from "./embeddable";
import { CustomerCreateInputSchema, CustomerSchema, CustomerUpdateInputSchema } from "./schema";
import { CUSTOMER_INCLUDE, loadCustomer, toCustomerDto } from "./to-customer-dto";

export const createCustomer = defineOperation({
  name: "customer.create",
  kind: "command",
  description:
    "Create a customer of one of the organization's customer types. `fields` must match the " +
    "type's own fields (e.g. org number).",
  input: CustomerCreateInputSchema,
  output: CustomerSchema,
  permission: "customer:write",
  embeddable: customerEmbeddable,
  handler: async ({ input: { entityTypeId, fields, ...data }, context }) => {
    const type = await loadTypeOfBase({ context, entityTypeId, base: "CUSTOMER" });
    if (!type.ok) return type;
    const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
    if (!checked.ok) return checked;
    const row = await createRecord({
      context,
      base: "CUSTOMER",
      entityTypeId,
      fields: checked.value.fields,
      links: checked.value.links,
      insert: ({ id }) =>
        context.db.customer.create({
          data: {
            id,
            ...data,
            entityTypeId,
            fields: toJson({ value: checked.value.fields }) ?? {},
            organizationId: context.organizationId,
          },
          include: CUSTOMER_INCLUDE,
        }),
    });
    const customer = toCustomerDto({ row, context });
    context.recordChange({ entityId: row.id, after: customer });
    return ok({ value: customer });
  },
});

export const updateCustomer = defineOperation({
  name: "customer.update",
  kind: "command",
  description:
    "Update a customer. Omitted properties are unchanged; `fields` is merged by key (null " +
    "clears a value). The type cannot be changed.",
  input: CustomerUpdateInputSchema,
  output: CustomerSchema,
  permission: "customer:write",
  embeddable: customerEmbeddable,
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadCustomer({ context, id });
    if (!before) return notFound({ entity: "Customer" });
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
    const row = await context.db.customer.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
      include: CUSTOMER_INCLUDE,
    });
    const customer = toCustomerDto({ row, context });
    context.recordChange({ entityId: id, before, after: customer });
    return ok({ value: customer });
  },
});
