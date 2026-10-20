import { type PermissionSet, PermissionUpdateInputSchema } from "@okazi/core/schemas";
import { formSchema } from "@/lib/form-schema";
import { toOverrides } from "../permission-grid";

/** Raw values of the grid: the `feature:action` keys that are on. */
export type PermissionFormValues = { granted: string[] };

export type PermissionFormSchemaInput = {
  subjectType: "member" | "apiKey";
  subjectId: string;
  preset: PermissionSet;
};

/** Core's `permission.update` schema validates the form; only the differences are sent. */
export function permissionFormSchema({
  subjectType,
  subjectId,
  preset,
}: PermissionFormSchemaInput) {
  return formSchema({
    schema: PermissionUpdateInputSchema,
    toInput: ({ values }: { values: PermissionFormValues }) => ({
      subjectType,
      subjectId,
      overrides: toOverrides({ granted: values.granted, preset }),
    }),
  });
}
