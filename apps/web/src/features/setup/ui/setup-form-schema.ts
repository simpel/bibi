import type { SetupDto } from "@okazi/core";
import { SetupCreateInputSchema } from "@okazi/core/schemas";
import { numberOrUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the setup form: both inputs are strings. */
export type SetupFormValues = { name: string; changeoverMinutes: string };

export type SetupFormInput = { values: SetupFormValues };

/** Form strings → the shape core's `setup.create` input schema validates. */
export function setupFormToInput({ values }: SetupFormInput) {
  return {
    name: values.name.trim(),
    changeoverMinutes: numberOrUndefined({ value: values.changeoverMinutes }),
  };
}

export const setupFormSchema = formSchema({
  schema: SetupCreateInputSchema,
  toInput: setupFormToInput,
});

export type SetupDefaultsInput = { setup?: SetupDto | undefined };

export function setupFormDefaults({ setup }: SetupDefaultsInput): SetupFormValues {
  return { name: setup?.name ?? "", changeoverMinutes: String(setup?.changeoverMinutes ?? 0) };
}
