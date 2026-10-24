import { listTimeZones } from "@bibi/core/schemas";

/** One pickable zone: its IANA name, a readable label, the current offset and its area. */
export type TimeZoneOption = { value: string; label: string; description: string; group: string };

export type TimeZoneOptionsInput = {
  locale: string;
  /** The instant the offsets are shown for. */
  now: Date;
};

const offsetOf = ({ zone, locale, now }: { zone: string; locale: string; now: Date }) =>
  new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "longOffset" })
    .formatToParts(now)
    .find((part) => part.type === "timeZoneName")?.value ?? "";

/** Every IANA zone for a searchable picker (ADR 0064), grouped by area (`Europe`, `America`, …). */
export function timeZoneOptions({ locale, now }: TimeZoneOptionsInput): TimeZoneOption[] {
  return listTimeZones().map((zone) => ({
    value: zone,
    label: zone.replaceAll("_", " "),
    description: offsetOf({ zone, locale, now }),
    group: zone.includes("/") ? (zone.split("/")[0] ?? zone) : zone,
  }));
}
