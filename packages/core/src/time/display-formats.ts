/** How a user wants dates written (ADR 0046): D day, MMM/MMMM month name, MM month, YYYY year. */
export const DATE_FORMATS = [
  "D_MMM_YYYY",
  "D_MMMM_YYYY",
  "YYYY_MM_DD",
  "DD_MM_YYYY",
  "MM_DD_YYYY",
] as const;

/** 24 hour (`14:30`) or 12 hour (`2:30 PM`) clock. */
export const CLOCK_FORMATS = ["H24", "H12"] as const;

export type DateFormat = (typeof DATE_FORMATS)[number];
export type ClockFormat = (typeof CLOCK_FORMATS)[number];

/** `27 Aug 2026`: what a user without a setting sees. */
export const DEFAULT_DATE_FORMAT: DateFormat = "D_MMM_YYYY";
export const DEFAULT_CLOCK_FORMAT: ClockFormat = "H24";

/** A user's choices; `null` = the default (ADR 0051). */
export type DisplayFormats = {
  dateFormat: DateFormat | null;
  clockFormat: ClockFormat | null;
};

/** An instant, or its ISO string from JSON (tool results, server action payloads). */
export type InstantLike = Date | string;

export const toInstant = ({ value }: { value: InstantLike }): Date =>
  value instanceof Date ? value : new Date(value);
