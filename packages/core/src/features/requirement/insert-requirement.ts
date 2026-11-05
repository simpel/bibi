import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkFree, checkLevel, checkValue } from "./requirement-rules";
import type { RequirementCreateInput, RequirementDto } from "./schema";
import { REQUIREMENT_INCLUDE, toRequirementDto } from "./to-requirement-dto";

export type InsertRequirementInput = { context: OperationContext; input: RequirementCreateInput };

/**
 * Creates a requirement on an order or one of its lines and records the change: a type of base
 * `REQUIREMENT`, an active list value of the organization, one count per value and level
 * (`CONFLICT` otherwise) and field values that match the type. Shared by `requirement.create`
 * and `order.create` (a new line's needs, ADR 0081).
 */
export async function insertRequirement({
  context,
  input: { entityTypeId, fields, ...data },
}: InsertRequirementInput): Promise<Result<RequirementDto>> {
  const level = { orderId: data.orderId, lineId: data.lineId ?? null };
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
    fields: checked.value.fields,
    links: checked.value.links,
    insert: ({ id }) =>
      context.db.requirement.create({
        data: {
          id,
          ...data,
          ...level,
          entityTypeId,
          fields: toJson({ value: checked.value.fields }) ?? {},
          organizationId: context.organizationId,
        },
        include: REQUIREMENT_INCLUDE,
      }),
  });
  const requirement = toRequirementDto({ row });
  context.recordChange({ entityId: row.id, after: requirement });
  return ok({ value: requirement });
}
