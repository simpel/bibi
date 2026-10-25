import "server-only";
import { createNumberFormat, type NumberFormat } from "@bibi/core/schemas";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { loadDisplayFormats } from "./display-formats";

/**
 * How a server component writes numbers and amounts (#482): the user's number format and
 * currency display on top of the UI language's style.
 */
export const getNumberFormat = cache(async (): Promise<NumberFormat> => {
  const [locale, { numberFormat, currencyDisplay }] = await Promise.all([
    getLocale(),
    loadDisplayFormats(),
  ]);
  return createNumberFormat({ locale, formats: { numberFormat, currencyDisplay } });
});
