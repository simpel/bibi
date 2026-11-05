import {
  COUNTRIES,
  Combobox,
  type ComboboxOption,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  localizedCountryName,
} from "@bibi/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Control, FieldValues, Path, UseFormReturn } from "react-hook-form";

export type CountryFieldProps<V extends FieldValues, O> = {
  form?: UseFormReturn<V, unknown, O>;
  control?: Control<V, unknown, O>;
  name: Path<V>;
  label: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Filterable country combobox form field displaying Unicode emoji flags and localized names.
 * Binds the 2-letter ISO 3166-1 alpha-2 code (e.g. "SE") to the form state.
 */
export function CountryField<V extends FieldValues, O>(props: CountryFieldProps<V, O>) {
  const { name, label, required, disabled, className } = props;
  const control = props.control ?? props.form?.control;
  if (!control) {
    throw new Error("CountryField requires either 'form' or 'control' prop");
  }

  const t = useTranslations("country");
  const locale = useLocale();

  const options = useMemo<ComboboxOption[]>(
    () =>
      COUNTRIES.map((c) => {
        const localized = localizedCountryName({ code: c.code, locale });
        return {
          value: c.code,
          label: `${c.flag}  ${localized}`,
          description: c.name !== localized ? `${c.name} · ${c.code}` : c.code,
          trailing: c.dialCode,
        };
      }),
    [locale],
  );

  return (
    <FormController
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </FormLabel>
          <FormControl>
            <Combobox
              options={options}
              value={String(field.value ?? "").toUpperCase()}
              onValueChange={field.onChange}
              placeholder={t("placeholder")}
              searchPlaceholder={t("search")}
              emptyText={t("empty")}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
