import { createNumberFormat, type NumberFormat } from "@bibi/core/schemas";
import { useLocale } from "next-intl";
import { useContext, useMemo } from "react";
import { DisplayFormatsContext } from "../time/display-formats-provider";

/**
 * How a client component writes numbers and amounts (#482): the user's number format on top of
 * the UI language's style, and their money format for every amount.
 */
export function useNumberFormat(): NumberFormat {
  const locale = useLocale();
  const { numberFormat, moneyFormat } = useContext(DisplayFormatsContext);
  return useMemo(
    () => createNumberFormat({ locale, formats: { numberFormat, moneyFormat } }),
    [locale, numberFormat, moneyFormat],
  );
}
