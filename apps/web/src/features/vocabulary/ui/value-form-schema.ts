import { VocabularyAddValueInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the list-value form: just the name. */
export type ValueFormValues = { name: string };

/** Core's value-name rule; the ids come from the action, not the form. */
export const valueFormSchema = formSchema({
  schema: VocabularyAddValueInputSchema.pick({ name: true }),
  toInput: ({ values }: { values: ValueFormValues }) => ({ name: values.name.trim() }),
});
