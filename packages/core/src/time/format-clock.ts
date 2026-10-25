import type { ClockFormat } from "./display-formats";
import type { DateParts } from "./format-date";
import { intlParts } from "./intl-parts";

export type FormatClockInput = DateParts & {
  clockFormat: ClockFormat;
  /** Append the zone's short name (`CET`), e.g. in an exact-time tooltip. */
  zoneName?: boolean;
  /** Show seconds, e.g. in a log line. */
  seconds?: boolean;
};

/** `instant` as a time of day in `timeZone`: `14:05` (H24) or `2:05 PM` (H12, locale's AM/PM). */
export function formatClock({
  clockFormat,
  zoneName = false,
  seconds = false,
  ...at
}: FormatClockInput): string {
  const h12 = clockFormat === "H12";
  const parts = intlParts({
    ...at,
    options: {
      hour: h12 ? "numeric" : "2-digit",
      minute: "2-digit",
      ...(seconds ? { second: "2-digit" } : {}),
      hourCycle: h12 ? "h12" : "h23",
      ...(zoneName ? { timeZoneName: "short" } : {}),
    },
  });
  const minutes = `${parts.hour ?? ""}:${parts.minute ?? ""}`;
  const clock = seconds ? `${minutes}:${parts.second ?? ""}` : minutes;
  const withPeriod = h12 ? `${clock} ${parts.dayPeriod ?? ""}` : clock;
  return zoneName ? `${withPeriod} ${parts.timeZoneName ?? ""}` : withPeriod;
}
