import type { HoldKind, ItemStateDto } from "@bibi/core/schemas";
import { ItemStateCreateInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the state form: name, color and the generic state flags (ADR 0044). */
export type ItemStateFormValues = {
  name: string;
  color: string;
  initial: boolean;
  hold: HoldKind;
  inSheets: boolean;
  released: boolean;
  expires: boolean;
};

export const itemStateFormSchema = ({ entityTypeId }: { entityTypeId: string }) =>
  formSchema({
    schema: ItemStateCreateInputSchema,
    toInput: ({ values }: { values: ItemStateFormValues }) => ({
      ...values,
      entityTypeId,
      name: values.name.trim(),
    }),
  });

export function itemStateFormDefaults({
  state,
}: {
  state?: ItemStateDto | undefined;
}): ItemStateFormValues {
  return {
    name: state?.name ?? "",
    color: state?.color ?? "#64748b",
    initial: state?.initial ?? false,
    hold: state?.hold ?? "NONE",
    inSheets: state?.inSheets ?? false,
    released: state?.released ?? false,
    expires: state?.expires ?? false,
  };
}
