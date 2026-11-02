import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { LinkValue } from "../../records/record-links";
import { archiveRecords, updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { regenerateForLine } from "../work-order/regenerate";
import { insertRequirement } from "./insert-requirement";
import {
  RequirementCreateInputSchema,
  RequirementIdInputSchema,
  RequirementSchema,
  RequirementUpdateInputSchema,
} from "./schema";
import { loadRequirement, REQUIREMENT_INCLUDE, toRequirementDto } from "./to-requirement-dto";

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
  permission: "program:write",
  followUp: regenerateForLine,
  handler: ({ input, context }) => insertRequirement({ context, input }),
});

export const updateRequirement = defineOperation({
  name: "requirement.update",
  kind: "command",
  description:
    "Change a requirement's count or field values. `fields` is merged by key (null clears a " +
    "value). The ticket, line, value and type never change; archive and create anew.",
  input: RequirementUpdateInputSchema,
  output: RequirementSchema,
  permission: "program:write",
  followUp: regenerateForLine,
  handler: async ({ input: { id, quantity, fields: patch }, context }) => {
    const before = await loadRequirement({ context, id });
    if (!before) return notFound({ entity: "Requirement" });
    let json: ReturnType<typeof toJson>;
    let links: LinkValue[] | undefined;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value.fields });
      links = checked.value.links;
    }
    await updateRecord({ context, id, change: { fields: json, links } });
    const row = await context.db.requirement.update({
      where: { id },
      data: { ...(quantity === undefined ? {} : { quantity }), ...(json ? { fields: json } : {}) },
      include: REQUIREMENT_INCLUDE,
    });
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
  permission: "program:delete",
  followUp: regenerateForLine,
  handler: async ({ input: { id }, context }) => {
    const before = await loadRequirement({ context, id });
    if (!before) return notFound({ entity: "Requirement" });
    const row = await context.db.requirement.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: REQUIREMENT_INCLUDE,
    });
    await archiveRecords({ context, ids: [id] });
    const requirement = toRequirementDto({ row });
    context.recordChange({ entityId: id, before, after: requirement });
    return ok({ value: requirement });
  },
});
