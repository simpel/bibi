import type { EntityTypeDto, RequirementDto } from "@okazi/core";
import { NONE } from "@/components/form/option-select-field";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";

/** Raw values of the requirement form: inputs are strings, `NONE` = the whole ticket. */
export type RequirementFormValues = {
  entityTypeId: string;
  lineId: string;
  vocabularyValueId: string;
  quantity: string;
  fields: Record<string, RawFieldValue>;
};

export type RequirementDefaultsInput = {
  type: EntityTypeDto | undefined;
  requirement?: RequirementDto | undefined;
};

export function requirementFormDefaults({
  type,
  requirement,
}: RequirementDefaultsInput): RequirementFormValues {
  return {
    entityTypeId: type?.id ?? "",
    lineId: requirement?.lineId ?? NONE,
    vocabularyValueId: requirement?.vocabularyValueId ?? "",
    quantity: requirement ? String(requirement.quantity) : "",
    fields: rawFields({ type, stored: requirement?.fields ?? {} }),
  };
}
