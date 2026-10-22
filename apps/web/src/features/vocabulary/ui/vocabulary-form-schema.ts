import type { VocabularyDto } from "@bibi/core";
import { VocabularyCreateInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the list form: name plus the initial values, one per line (create only). */
export type VocabularyFormValues = { name: string; values: string };

export type VocabularyFormInput = { values: VocabularyFormValues };

const LINES = /\r?\n/;

/** "a\n b\n" → ["a", "b"]; no values → undefined (an edit only renames). */
export function parseLines({ text }: { text: string }): string[] | undefined {
  const lines = text
    .split(LINES)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
}

/** Form strings → the shape core's `vocabulary.create` input schema validates. */
export function vocabularyFormToInput({ values }: VocabularyFormInput) {
  return { name: values.name.trim(), values: parseLines({ text: values.values }) };
}

export const vocabularyFormSchema = formSchema({
  schema: VocabularyCreateInputSchema,
  toInput: vocabularyFormToInput,
});

export type VocabularyDefaultsInput = { vocabulary?: VocabularyDto | undefined };

export function vocabularyFormDefaults({
  vocabulary,
}: VocabularyDefaultsInput): VocabularyFormValues {
  return { name: vocabulary?.name ?? "", values: "" };
}
