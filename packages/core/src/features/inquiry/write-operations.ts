import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { assignOnCreate, checkNewAssignee } from "../assignment/assign-on-create";
import { checkCustomer } from "../booking/booking-rules";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { checkContact, checkDesiredPeriod } from "./inquiry-rules";
import { InquiryCreateInputSchema, InquirySchema, InquiryUpdateInputSchema } from "./schema";
import { loadInquiry, toInquiryDto } from "./to-inquiry-dto";
import { checkInquiryDetails } from "./update-rules";

export const createInquiry = defineOperation({
  name: "inquiry.create",
  kind: "command",
  description:
    "Register an inquiry of one of the organization's inquiry types from a customer. It starts " +
    "in status NEW. The contact must work at the customer, `assigneeId` (a member) becomes the " +
    "main assignee and " +
    "`fields` must match the type's own fields.",
  input: InquiryCreateInputSchema,
  output: InquirySchema,
  permission: "inquiry:write",
  handler: async ({ input: { entityTypeId, fields, assigneeId, ...data }, context }) => {
    const type = await loadTypeOfBase({ context, entityTypeId, base: "INQUIRY" });
    if (!type.ok) return type;
    for (const check of [
      checkDesiredPeriod(data),
      await checkCustomer({ context, customerId: data.customerId }),
      await checkContact({ context, ...data }),
      await checkNewAssignee({ context, assigneeId }),
    ]) {
      if (!check.ok) return check;
    }
    const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
    if (!checked.ok) return checked;
    const row = await context.db.inquiry.create({
      data: {
        ...data,
        entityTypeId,
        fields: toJson({ value: checked.value }) ?? {},
        organizationId: context.organizationId,
      },
    });
    const inquiry = toInquiryDto({ row });
    context.recordChange({ entityId: row.id, after: inquiry });
    await assignOnCreate({ context, subjectType: "INQUIRY", subjectId: row.id, assigneeId });
    return ok({ value: inquiry });
  },
});

export const updateInquiry = defineOperation({
  name: "inquiry.update",
  kind: "command",
  description:
    "Update an inquiry's customer, contact, desired dates, quantity, budget or own fields. " +
    "Omitted properties are unchanged; `fields` is merged by key (null clears a value). The " +
    "type cannot be changed, the status changes only with the inquiry's own commands " +
    "(inquiry.qualify, inquiry.markLost) and the assignee with assignment.assign.",
  input: InquiryUpdateInputSchema,
  output: InquirySchema,
  permission: "inquiry:write",
  handler: async ({ input: { id, fields: patch, ...data }, context }) => {
    const before = await loadInquiry({ context, id });
    if (!before) return notFound({ entity: "Inquiry" });
    const details = await checkInquiryDetails({ context, before, change: data });
    if (!details.ok) return details;
    let json: ReturnType<typeof toJson>;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value });
    }
    const row = await context.db.inquiry.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
    });
    const inquiry = toInquiryDto({ row });
    context.recordChange({ entityId: id, before, after: inquiry });
    return ok({ value: inquiry });
  },
});
