import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type BookableSectionProps = { form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput> };

/** BOOKABLE capability: the default booking length. */
export function BookableSection({ form }: BookableSectionProps) {
  const t = useTranslations("item");
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-sm font-semibold">{t("sections.bookable")}</legend>
      <TextField
        form={form}
        name="defaultDurationMinutes"
        label={t("fields.defaultDurationMinutes")}
        type="number"
      />
    </fieldset>
  );
}
