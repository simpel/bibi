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

export type LinePeriodInput = Omit<OccupancyPeriodInput, "startsAt" | "endsAt"> & {
  startsAt: string | null;
  endsAt: string | null;
};

/** A line's period, or null for an untimed line (ADR 0052). */
export function linePeriod({ format, startsAt, endsAt }: LinePeriodInput): string | null {
  return startsAt && endsAt ? occupancyPeriod({ format, startsAt, endsAt }) : null;
}
