import type { SetupDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type SetupsSectionProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  setups: SetupDto[];
};

/** SETUPS behaviour: one capacity per setup of the organization; empty = not used. */
export function SetupsSection({ form, setups }: SetupsSectionProps) {
  const t = useTranslations("item");
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-1 text-sm font-semibold">{t("sections.setups")}</legend>
      <p className="text-sm text-muted-foreground">
        {setups.length === 0 ? t("noSetups") : t("setupsHint")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {setups.map(({ id, name }) => (
          <TextField key={id} form={form} name={`setups.${id}`} label={name} type="number" />
        ))}
      </div>
    </fieldset>
  );
}
