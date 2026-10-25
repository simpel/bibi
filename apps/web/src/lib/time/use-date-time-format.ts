import { createDateTimeFormat, type DateTimeFormat } from "@bibi/core/schemas";
import { useLocale } from "next-intl";
import { useContext, useMemo } from "react";
import { DisplayFormatsContext } from "./display-formats-provider";
import { useOrganizationTimeZone } from "./use-organization-time-zone";

/**
 * How a client component writes dates and times (#481): the user's formats, the UI language and
 * the organization's zone (ADR 0064). Pass `timeZone` per call for a venue's times.
 */
export function useDateTimeFormat(): DateTimeFormat {
  const locale = useLocale();
  const timeZone = useOrganizationTimeZone();
  const formats = useContext(DisplayFormatsContext);
  return useMemo(
    () => createDateTimeFormat({ locale, timeZone, formats }),
    [locale, timeZone, formats],
  );
}
