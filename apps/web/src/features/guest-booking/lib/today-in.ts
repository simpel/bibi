import { toIsoDate, toZonedParts } from "@bibi/core/schemas";

export type TodayInInput = { timeZone: string; now: Date };

/** Today's plain date (`YYYY-MM-DD`) in the room's zone (ADR 0064). */
export function todayIn({ timeZone, now }: TodayInInput): string {
  return toIsoDate({ date: toZonedParts({ instant: now, timeZone }).date });
}
