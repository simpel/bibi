import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
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
  permission: "customer:create",
  embeddable: customerEmbeddable,
  handler: async ({ input: { entityTypeId, fields, ...data }, context }) => {
    const type = await loadTypeOfBase({ context, entityTypeId, base: "CUSTOMER" });
    if (!type.ok) return type;
    const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
    if (!checked.ok) return checked;
    const row = await context.db.customer.create({
      data: {
        ...data,
        entityTypeId,
        fields: toJson({ value: checked.value }) ?? {},
        organizationId: context.organizationId,
      },
      include: CUSTOMER_INCLUDE,
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
  permission: "customer:edit",
  embeddable: customerEmbeddable,
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadCustomer({ context, id });
    if (!before) return notFound({ entity: "Customer" });
    let json: ReturnType<typeof toJson>;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const { entityTypeId } = before;
      const checked = await validateFields({ context, entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value });
    }
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
