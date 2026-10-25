import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { clockFormatOptions, dateFormatOptions } from "./display-format-options";
import { currencyDisplayOptions, numberFormatOptions } from "./number-format-options";

/** Every format select's items: a live example, its short name and a default mark. */
export function useFormatOptions() {
  const t = useTranslations("userSettings");
  const locale = useLocale();
  const timeZone = useOrganizationTimeZone();
  return useMemo(() => {
    const mark = ({ label, isDefault }: { label: string; isDefault: boolean }) =>
      isDefault ? t("withDefault", { label }) : label;
    const items = <V extends string>({
      options,
      name,
    }: {
      options: { value: V; example: string; isDefault: boolean }[];
      name: (input: { value: V; example: string }) => string;
    }) =>
      options.map(({ value, example, isDefault }) => ({
        value,
        label: mark({ label: name({ value, example }), isDefault }),
      }));
    return {
      dates: items({
        options: dateFormatOptions({ locale, timeZone }),
        name: ({ value, example }) => t(`dateFormats.${value}`, { example }),
      }),
      clocks: items({
        options: clockFormatOptions({ locale, timeZone }),
        name: ({ value, example }) => t(`clockFormats.${value}`, { example }),
      }),
      numbers: items({
        options: numberFormatOptions({ locale }),
        name: ({ value, example }) => t(`numberFormats.${value}`, { example }),
      }),
      currencies: items({
        options: currencyDisplayOptions({ locale }),
        name: ({ value, example }) => t(`currencyDisplays.${value}`, { example }),
      }),
    };
  }, [locale, timeZone, t]);
}
