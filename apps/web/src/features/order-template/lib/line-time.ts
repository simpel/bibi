export type SplitMinutesInput = { minutes: number };

/** Whole hours and the minutes left, for "1 h 30 min". */
export function splitMinutes({ minutes }: SplitMinutesInput): { hours: number; minutes: number } {
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}
