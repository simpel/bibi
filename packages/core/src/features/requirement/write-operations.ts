import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { createRecord } from "../../records/create-record";
import { archiveRecords, updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { checkFree, checkLevel, checkValue } from "./requirement-rules";
import {
  RequirementCreateInputSchema,
  RequirementIdInputSchema,
  RequirementSchema,
  RequirementUpdateInputSchema,
} from "./schema";
import { loadRequirement, toRequirementDto } from "./to-requirement-dto";

export const createRequirement = defineOperation({
  name: "requirement.create",
  kind: "command",
  description:
    "Register a requirement: a count against a list value (e.g. Gluten × 3 from the list " +
    "Allergens) on a ticket, or on one of its lines, where it replaces the ticket's " +
    "count for that value. One count per value and level (CONFLICT otherwise; update it). " +
    "Never about a person: no names or guest details, only counts.",
  input: RequirementCreateInputSchema,
  output: RequirementSchema,
  permission: "requirement:write",
  handler: async ({ input: { entityTypeId, fields, ...data }, context }) => {
    const level = { ticketId: data.ticketId, lineId: data.lineId ?? null };
    const { vocabularyValueId } = data;
    for (const check of [
      await loadTypeOfBase({ context, entityTypeId, base: "REQUIREMENT" }),
      await checkLevel({ context, ...level }),
      await checkValue({ context, vocabularyValueId }),
      await checkFree({ context, ...level, vocabularyValueId }),
    ]) {
      if (!check.ok) return check;
    }
    const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
    if (!checked.ok) return checked;
    const row = await createRecord({
      context,
      base: "REQUIREMENT",
      entityTypeId,
      fields: checked.value,
      insert: ({ id }) =>
        context.db.requirement.create({
          data: {
            id,
            ...data,
            ...level,
            entityTypeId,
            fields: toJson({ value: checked.value }) ?? {},
            organizationId: context.organizationId,
          },
        }),
    });
    const requirement = toRequirementDto({ row });
    context.recordChange({ entityId: row.id, after: requirement });
    return ok({ value: requirement });
  },
});

export const updateRequirement = defineOperation({
  name: "requirement.update",
  kind: "command",
  description:
    "Change a requirement's count or field values. `fields` is merged by key (null clears a " +
    "value). The ticket, line, value and type never change; archive and create anew.",
  input: RequirementUpdateInputSchema,
  output: RequirementSchema,
  permission: "requirement:write",
  handler: async ({ input: { id, quantity, fields: patch }, context }) => {
    const before = await loadRequirement({ context, id });
    if (!before) return notFound({ entity: "Requirement" });
    let json: ReturnType<typeof toJson>;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value });
    }
    const row = await context.db.requirement.update({
      where: { id },
      data: { ...(quantity === undefined ? {} : { quantity }), ...(json ? { fields: json } : {}) },
    });
    await updateRecord({ context, id, change: { fields: json } });
    const requirement = toRequirementDto({ row });
    context.recordChange({ entityId: id, before, after: requirement });
    return ok({ value: requirement });
  },
});

export const archiveRequirement = defineOperation({
  name: "requirement.archive",
  kind: "command",
  description:
    "Remove (archive) a requirement. On a line the ticket's count for the value " +
    "applies there again.",
  input: RequirementIdInputSchema,
  output: RequirementSchema,
  permission: "requirement:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadRequirement({ context, id });
    if (!before) return notFound({ entity: "Requirement" });
    const row = await context.db.requirement.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    await archiveRecords({ context, ids: [id] });
    const requirement = toRequirementDto({ row });
    context.recordChange({ entityId: id, before, after: requirement });
    return ok({ value: requirement });
  },
});
