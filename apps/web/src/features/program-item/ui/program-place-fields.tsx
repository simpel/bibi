import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "../../booking/ui/option-select-field";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramItemFormOutput } from "./program-item-form-schema";
import type { ProgramItemFormValues } from "./program-item-form-values";

export type ProgramPlaceFieldsProps = {
  form: UseFormReturn<ProgramItemFormValues, unknown, ProgramItemFormOutput>;
  data: ProgramFormData;
};

/** The bookable item, then one of that item's setups (only when it has any). */
export function ProgramPlaceFields({ form, data }: ProgramPlaceFieldsProps) {
  const t = useTranslations("programItem");
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
