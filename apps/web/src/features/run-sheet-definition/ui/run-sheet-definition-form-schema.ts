import type { RunSheetDefinitionDto } from "@bibi/core";
import { RunSheetDefinitionCreateInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the run sheet form. */
export type RunSheetDefinitionFormValues = {
  name: string;
  entityTypeIds: string[];
  fieldIds: string[];
  vocabularyIds: string[];
  responsibilityId: string;
};

export type RunSheetDefinitionFormInput = { values: RunSheetDefinitionFormValues };

/** Form values → the shape core's `runSheetDefinition.create` input schema validates. */
export function runSheetDefinitionFormToInput({ values }: RunSheetDefinitionFormInput) {
  return { ...values, name: values.name.trim() };
}

export const runSheetDefinitionFormSchema = formSchema({
  schema: RunSheetDefinitionCreateInputSchema,
  toInput: runSheetDefinitionFormToInput,
});

export type RunSheetDefinitionDefaultsInput = { runSheet?: RunSheetDefinitionDto | undefined };

export function runSheetDefinitionFormDefaults({
  runSheet,
}: RunSheetDefinitionDefaultsInput): RunSheetDefinitionFormValues {
  return {
    name: runSheet?.name ?? "",
    entityTypeIds: runSheet?.entityTypeIds ?? [],
    fieldIds: runSheet?.fieldIds ?? [],
    vocabularyIds: runSheet?.vocabularyIds ?? [],
    responsibilityId: runSheet?.responsibilityId ?? "",
  };
}
