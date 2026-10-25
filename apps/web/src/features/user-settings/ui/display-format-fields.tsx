import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { DisplayFormatValues } from "./display-format-form";
import { FormatSelectField } from "./format-select-field";
import { useFormatOptions } from "./use-format-options";

export type DisplayFormatFieldsProps = {
  control: Control<DisplayFormatValues, unknown, DisplayFormatValues>;
};

/** The date and clock selects of the display format form. */
export function DisplayFormatFields({ control }: DisplayFormatFieldsProps) {
  const t = useTranslations("userSettings");
  const { dates, clocks } = useFormatOptions();
  return (
    <>
      <FormatSelectField
        control={control}
        name="dateFormat"
        label={t("dateFormat")}
        options={dates}
      />
      <FormatSelectField
        control={control}
        name="clockFormat"
        label={t("clockFormat")}
        options={clocks}
      />
    </>
  );
}
