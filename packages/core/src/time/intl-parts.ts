/** One `Intl.DateTimeFormat` per locale, zone and options: building them is the slow part. */
const cache = new Map<string, Intl.DateTimeFormat>();

export type PartsInput = {
  locale: string;
  timeZone: string;
  instant: Date;
  options: Intl.DateTimeFormatOptions;
};

/** `instant`'s parts in `timeZone` as type → value, e.g. `{ day: "27", month: "Aug" }`. */
export function intlParts({ locale, timeZone, instant, options }: PartsInput) {
  const key = JSON.stringify([locale, timeZone, options]);
  let format = cache.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    cache.set(key, format);
  }
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of format.formatToParts(instant)) parts[part.type] = part.value;
  return parts;
}
