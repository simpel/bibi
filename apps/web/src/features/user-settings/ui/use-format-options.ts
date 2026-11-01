import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { clockFormatOptions, dateFormatOptions } from "./display-format-options";
import {
  LANGUAGE_NUMBER_FORMAT,
  moneyFormatOptions,
  numberFormatOptions,
} from "./number-format-options";

type Items<V extends string> = { value: V; label: string }[];

/** Every format select's items, each labelled with its live example alone. */
export function useFormatOptions() {
  const t = useTranslations("userSettings");
  const locale = useLocale();
  const timeZone = useOrganizationTimeZone();
  return useMemo(() => {
    const examples = <V extends string>({
      options,
    }: {
      options: { value: V; example: string }[];
    }): Items<V> => options.map(({ value, example }) => ({ value, label: example }));
    return {
      dates: examples({ options: dateFormatOptions({ locale, timeZone }) }),
      clocks: clockFormatOptions({ locale, timeZone }).map(({ value }) => ({
        value,
        label: t(`clockFormats.${value}`),
      })),
      numbers: numberFormatOptions({ locale }).map(({ value, example }) => ({
        value,
        label: value === LANGUAGE_NUMBER_FORMAT ? t("numberFormats.LANGUAGE") : example,
      })),
      currencies: examples({ options: moneyFormatOptions({ locale }) }),
    };
  }, [locale, timeZone, t]);
}
