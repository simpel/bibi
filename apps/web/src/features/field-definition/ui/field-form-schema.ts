import type { FieldDefinitionDto } from "@okazi/core";
import {
  FieldDefinitionCreateInputSchema,
  type FieldKind,
  isChoiceKind,
} from "@okazi/core/schemas";
import type { z } from "zod";
import { blankToUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

export type FieldSource = "list" | "options";

/**
 * Raw values of the field form: choice fields take a list OR inline options (one per line),
 * LINK fields a target type.
 */
export type FieldFormValues = {
  entityTypeId: string;
  name: string;
  kind: FieldKind;
  required: boolean;
  source: FieldSource;
  vocabularyId: string;
  options: string;
  linkTypeId: string;
};

/** What the resolver outputs: core's create input. */
export type FieldFormOutput = z.infer<typeof FieldDefinitionCreateInputSchema>;

export type FieldFormInput = { values: FieldFormValues };

const LINES = /\r?\n/;

/** Form values → the shape core's `fieldDefinition.create` input schema validates. */
export function fieldFormToInput({ values }: FieldFormInput) {
  const choice = isChoiceKind({ kind: values.kind });
  const options = values.options
    .split(LINES)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    entityTypeId: values.entityTypeId,
    name: values.name.trim(),
    kind: values.kind,
    required: values.required,
    vocabularyId:
      choice && values.source === "list"
        ? blankToUndefined({ value: values.vocabularyId })
        : undefined,
    options: choice && values.source === "options" ? options : undefined,
    linkTypeId: values.kind === "LINK" ? blankToUndefined({ value: values.linkTypeId }) : undefined,
  };
}

export const fieldFormSchema = formSchema({
  schema: FieldDefinitionCreateInputSchema,
  toInput: fieldFormToInput,
});

export type FieldDefaultsInput = { entityTypeId: string; field?: FieldDefinitionDto | undefined };

export function fieldFormDefaults({ entityTypeId, field }: FieldDefaultsInput): FieldFormValues {
  return {
    entityTypeId,
    name: field?.name ?? "",
    kind: field?.kind ?? "TEXT",
    required: field?.required ?? false,
    source: field && field.options.length > 0 ? "options" : "list",
    vocabularyId: field?.vocabularyId ?? "",
    options: field?.options.join("\n") ?? "",
    linkTypeId: field?.linkTypeId ?? "",
  };
}
