import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";
import type { ProgramFormData } from "./program-form-data";
import { ProgramItemField } from "./program-item-field";

export type ProgramPlaceFieldsProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  data: ProgramFormData;
};

/** The bookable item (searchable, full width), then one of its layouts (only when it has any). */
export function ProgramPlaceFields({ form, data }: ProgramPlaceFieldsProps) {
  const t = useTranslations("line");
  const itemId = form.watch("itemId");
  const layouts = (data.items.find((item) => item.id === itemId)?.layouts ?? []).map(
    ({ id, name, capacity }) => ({
      id,
      name: capacity === null ? name : t("layoutOption", { name, capacity }),
    }),
  );
  return (
    <>
      <ProgramItemField form={form} data={data} />
      {layouts.length > 0 ? (
        <OptionSelectField
          control={form.control}
          name="layoutId"
          label={t("fields.layout")}
          options={layouts}
          noneLabel={t("noLayout")}
        />
      ) : null}
    </>
  );
}
