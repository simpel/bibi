import { Combobox, FormControl, FormController, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { NONE } from "@/components/form/option-select-field";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { priceText } from "../../item/ui/price-text";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";
import type { ProgramFormData } from "./program-form-data";

export type ProgramItemFieldProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  data: ProgramFormData;
};

/** The bookable item, searched by name with its list price, full width; "No room" first. */
export function ProgramItemField({ form, data }: ProgramItemFieldProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const items = useTranslations("item");
  const { money } = useNumberFormat();
  const options = useMemo(
    () => [
      { value: NONE, label: t("noItem") },
      ...data.items.map((item) => ({
        value: item.id,
        label: item.name,
        ...(item.priceMinor === null ? {} : { trailing: priceText({ item, money, t: items }) }),
      })),
    ],
    [data.items, money, t, items],
  );
  return (
    <FormController
      control={form.control}
      name="itemId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.item")}</FormLabel>
          <FormControl>
            <Combobox
              options={options}
              value={String(field.value ?? NONE)}
              onValueChange={field.onChange}
              disabled={data.itemsHidden}
              placeholder={data.itemsHidden ? common("hidden") : common("select")}
              searchPlaceholder={t("itemSearch")}
              emptyText={t("noItemMatch")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
