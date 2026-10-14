import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type BookingSectionProps = { form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput> };

/** BOOKABLE behaviour: the default booking length. */
export function BookingSection({ form }: BookingSectionProps) {
  const t = useTranslations("item");
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-sm font-semibold">{t("sections.booking")}</legend>
      <TextField
        form={form}
        name="defaultDurationMinutes"
        label={t("fields.defaultDurationMinutes")}
        type="number"
      />
    </fieldset>
  );
}
