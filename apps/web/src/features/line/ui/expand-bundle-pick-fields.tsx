import type { LineExpandBundleInput } from "@okazi/core/schemas";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { ExpandBundleFormValues } from "./expand-bundle-schema";
import type { ProgramFormData } from "./program-form-data";

export type ExpandBundlePickFieldsProps = {
  form: UseFormReturn<ExpandBundleFormValues, unknown, LineExpandBundleInput>;
  data: ProgramFormData;
};

/** The bundle to add and the line type its lines get. */
export function ExpandBundlePickFields({ form, data }: ExpandBundlePickFieldsProps) {
  const t = useTranslations("line");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <OptionSelectField
        control={form.control}
        name="itemId"
        label={t("bundleFields.itemId")}
        options={data.bundles}
      />
      <OptionSelectField
        control={form.control}
        name="entityTypeId"
        label={t("fields.type")}
        options={data.types}
      />
    </div>
  );
}
