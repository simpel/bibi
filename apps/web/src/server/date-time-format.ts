import "server-only";
import { createDateTimeFormat, type DateTimeFormat } from "@bibi/core/schemas";
import { getLocale, getTimeZone } from "next-intl/server";
import { cache } from "react";
import { loadDisplayFormats } from "./display-formats";

/**
 * How a server component writes dates and times (#481): the user's formats, the UI language and
 * the organization's zone (ADR 0064). Pass `timeZone` per call for a venue's times.
 */
export const getDateTimeFormat = cache(async (): Promise<DateTimeFormat> => {
  const [locale, timeZone, formats] = await Promise.all([
    getLocale(),
    getTimeZone(),
    loadDisplayFormats(),
  ]);
  return createDateTimeFormat({ locale, timeZone, formats });
});
