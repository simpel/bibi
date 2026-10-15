import type { useFormatter } from "next-intl";

export type OccupancyPeriodInput = {
  format: ReturnType<typeof useFormatter>;
  startsAt: string;
  endsAt: string;
};

/** `[startsAt, endsAt)` as one localized range, e.g. "1 Nov 2026, 08:00 – 10:00". */
export function occupancyPeriod({ format, startsAt, endsAt }: OccupancyPeriodInput): string {
  return format.dateTimeRange(new Date(startsAt), new Date(endsAt), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
