import type { SheetDefinitionDto } from "@okazi/core";
import { SheetDefinitionCreateInputSchema } from "@okazi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the sheet form. */
export type SheetDefinitionFormValues = {
  name: string;
  entityTypeIds: string[];
  fieldIds: string[];
  vocabularyIds: string[];
  responsibilityId: string;
};

export type SheetDefinitionFormInput = { values: SheetDefinitionFormValues };

/** Form values → the shape core's `sheetDefinition.create` input schema validates. */
export function sheetDefinitionFormToInput({ values }: SheetDefinitionFormInput) {
  return { ...values, name: values.name.trim() };
}

export const sheetDefinitionFormSchema = formSchema({
  schema: SheetDefinitionCreateInputSchema,
  toInput: sheetDefinitionFormToInput,
});

export type SheetDefinitionDefaultsInput = { sheet?: SheetDefinitionDto | undefined };

export function sheetDefinitionFormDefaults({
  sheet,
}: SheetDefinitionDefaultsInput): SheetDefinitionFormValues {
  return {
    name: sheet?.name ?? "",
    entityTypeIds: sheet?.entityTypeIds ?? [],
    fieldIds: sheet?.fieldIds ?? [],
    vocabularyIds: sheet?.vocabularyIds ?? [],
    responsibilityId: sheet?.responsibilityId ?? "",
  };
}
