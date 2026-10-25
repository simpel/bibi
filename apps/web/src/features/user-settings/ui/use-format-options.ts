import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { clockFormatOptions, dateFormatOptions } from "./display-format-options";

/** Date and clock options as select items: a live example, its short name and a default mark. */
export function useFormatOptions() {
  const t = useTranslations("userSettings");
  const locale = useLocale();
  const timeZone = useOrganizationTimeZone();
  return useMemo(() => {
    const mark = ({ label, isDefault }: { label: string; isDefault: boolean }) =>
      isDefault ? t("withDefault", { label }) : label;
    const dates = dateFormatOptions({ locale, timeZone }).map(({ value, example, isDefault }) => ({
      value,
      label: mark({ label: t(`dateFormats.${value}`, { example }), isDefault }),
    }));
    const clocks = clockFormatOptions({ locale, timeZone }).map(
      ({ value, example, isDefault }) => ({
        value,
        label: mark({ label: t(`clockFormats.${value}`, { example }), isDefault }),
      }),
    );
    return { dates, clocks };
  }, [locale, timeZone, t]);
}
