import type { ResponsibilityDto } from "@okazi/core";
import { ResponsibilityCreateInputSchema } from "@okazi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the responsibility form. */
export type ResponsibilityFormValues = {
  name: string;
  entityTypeIds: string[];
  defaultAssigneeId: string;
  defaultFollowerIds: string[];
};

export type ResponsibilityFormInput = { values: ResponsibilityFormValues };

/** Form values → the shape core's `responsibility.create` input schema validates. */
export function responsibilityFormToInput({ values }: ResponsibilityFormInput) {
  return { ...values, name: values.name.trim() };
}

export const responsibilityFormSchema = formSchema({
  schema: ResponsibilityCreateInputSchema,
  toInput: responsibilityFormToInput,
});

export type ResponsibilityDefaultsInput = { responsibility?: ResponsibilityDto | undefined };

export function responsibilityFormDefaults({
  responsibility,
}: ResponsibilityDefaultsInput): ResponsibilityFormValues {
  return {
    name: responsibility?.name ?? "",
    entityTypeIds: responsibility?.entityTypeIds ?? [],
    defaultAssigneeId: responsibility?.defaultAssigneeId ?? "",
    defaultFollowerIds: responsibility?.defaultFollowerIds ?? [],
  };
}
