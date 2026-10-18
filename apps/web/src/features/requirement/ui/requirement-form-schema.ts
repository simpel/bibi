import type {
  EntityTypeDto,
  RequirementDto,
  RequirementUpdateInput,
  VocabularyDto,
} from "@okazi/core";
import { buildFieldsSchema, RequirementCreateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import type { RequirementFormValues } from "./requirement-form-values";

/** What the resolver outputs: core's create input. */
export type RequirementFormOutput = z.infer<typeof RequirementCreateInputSchema>;

export type RequirementSchemaInput = {
  ticketId: string;
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
};

/** Core's requirement schema with `fields` checked against the type; the server checks again. */
export function requirementFormSchema({ ticketId, type, vocabularies }: RequirementSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: RequirementCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: RequirementFormValues }) => ({
      ticketId,
      programItemId: values.programItemId === NONE ? null : values.programItemId,
      entityTypeId: values.entityTypeId,
      vocabularyValueId: values.vocabularyValueId,
      quantity: numberOrNull({ value: values.quantity }),
      fields: fieldsToInput({ values, specs }),
    }),
  });
}

export type RequirementUpdateArgs = {
  requirement: RequirementDto;
  values: RequirementFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `requirement.update` input (only the count and fields change). */
export function toRequirementUpdate({
  requirement,
  values,
  type,
}: RequirementUpdateArgs): RequirementUpdateInput {
  return {
    id: requirement.id,
    quantity: values.quantity,
    fields: fieldsPatch({ type, stored: requirement.fields, fields: values.fields }),
  };
}
