import { FALLBACK_TIME_ZONE, listTimeZones } from "@bibi/core/schemas";

/**
 * The zone the browser runs in, as the default for a new organization (ADR 0064 decision 3a); the
 * fallback when the browser reports none or an alias the picker does not list (`Etc/UTC`,
 * `Asia/Calcutta`). Client only.
 */
export function browserTimeZone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return listTimeZones().includes(zone) ? zone : FALLBACK_TIME_ZONE;
}
