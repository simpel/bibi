import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type MaxPeopleSectionProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
};

/** SETUPS capability (Layouts in the UI): the room's legal people limit (ADR 0103). */
export function MaxPeopleSection({ form }: MaxPeopleSectionProps) {
  const t = useTranslations("item");
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-sm font-semibold">{t("sections.layouts")}</legend>
      <div className="grid gap-2 sm:max-w-xs">
        <TextField form={form} name="maxPeople" label={t("maxPeople")} type="number" required />
        <p className="text-sm text-muted-foreground">{t("maxPeopleHint")}</p>
      </div>
    </fieldset>
  );
}
