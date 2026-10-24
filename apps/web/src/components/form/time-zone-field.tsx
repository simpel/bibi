import { Combobox, FormControl, FormController, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { useLocale, useNow, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { timeZoneOptions } from "@/lib/time/time-zone-options";
import { NONE } from "./option-select-field";

export type TimeZoneFieldProps<V extends FieldValues, O> = {
  control: Control<V, unknown, O>;
  name: Path<V>;
  label: string;
  /** Label of an extra "inherit" choice (value `NONE`); omitted = a zone is required. */
  inheritLabel?: string;
};

/** A searchable dropdown of IANA zones with their current offset (ADR 0064). */
export function TimeZoneField<V extends FieldValues, O>(props: TimeZoneFieldProps<V, O>) {
  const { control, name, label, inheritLabel } = props;
  const t = useTranslations("timeZone");
  const locale = useLocale();
  const now = useNow();
  const zones = useMemo(() => timeZoneOptions({ locale, now }), [locale, now]);
  const options = useMemo(
    () => (inheritLabel ? [{ value: NONE, label: inheritLabel }, ...zones] : zones),
    [inheritLabel, zones],
  );
  return (
    <FormController
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Combobox
              options={options}
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
              placeholder={t("placeholder")}
              searchPlaceholder={t("search")}
              emptyText={t("empty")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
