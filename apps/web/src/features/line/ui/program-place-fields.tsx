import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";
import type { ProgramFormData } from "./program-form-data";

export type ProgramPlaceFieldsProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  data: ProgramFormData;
};

/** The bookable item, then one of that item's setups (only when it has any). */
export function ProgramPlaceFields({ form, data }: ProgramPlaceFieldsProps) {
  const t = useTranslations("line");
  const itemId = form.watch("itemId");
  const setupIds = data.items.find((item) => item.id === itemId)?.setupIds ?? [];
  const setups = data.setups.filter((setup) => setupIds.includes(setup.id));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <OptionSelectField
        control={form.control}
        name="itemId"
        label={t("fields.item")}
        options={data.items}
        hidden={data.itemsHidden}
        noneLabel={t("noItem")}
      />
      {setups.length > 0 ? (
        <OptionSelectField
          control={form.control}
          name="setupId"
          label={t("fields.setup")}
          options={setups}
          noneLabel={t("noSetup")}
        />
      ) : null}
    </div>
  );
}
