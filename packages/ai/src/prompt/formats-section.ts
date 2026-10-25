import {
  createDateTimeFormat,
  createNumberFormat,
  DEFAULT_CURRENCY,
  type DisplayFormats,
} from "@bibi/core";

/** How this user reads values: their settings (ADR 0046, #482), the UI language and the zone. */
export type PromptFormats = { locale: string; timeZone: string; formats: DisplayFormats };

export type FormatsSectionInput = PromptFormats & { now: Date };

/** A fixed sample, so the examples show the pattern rather than today's values. */
const SAMPLE = new Date("2026-08-27T12:30:00Z");

/**
 * Tells the model to write dates, times, numbers and amounts the way the user's UI does, with
 * live examples from the same formatters the web app uses. Tool results stay machine values.
 */
export function formatsSection({ locale, timeZone, formats, now }: FormatsSectionInput): string {
  const dates = createDateTimeFormat({ locale, timeZone, formats });
  const numbers = createNumberFormat({ locale, formats });
  const date = dates.date({ instant: SAMPLE });
  const time = dates.time({ instant: SAMPLE });
  const money = numbers.money({ minor: 123450, currency: DEFAULT_CURRENCY });
  const number = numbers.number({ value: 1234.5 });
  return [
    "## Formats (the user's settings)",
    `- Write dates like ${date} and times like ${time}. Tool results give instants in ISO 8601 ` +
      `(UTC) and a \`timeZone\`; write them in that zone, else in ${timeZone}.`,
    `- Write amounts like ${money} and other numbers like ${number}. Tool amounts are minor ` +
      "units (fields ending in `Minor`): divide by 100 and use the record's `currency` when it " +
      "has one.",
    `- Current local time: ${dates.dateTime({ instant: now })} (${timeZone}).`,
  ].join("\n");
}
