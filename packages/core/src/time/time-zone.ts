import { z } from "zod";
import { isValidTimeZone } from "./zoned-time";

/**
 * The zone when no organization applies: pages outside an organization, platform jobs, and the
 * default of a new organization until it chooses one (ADR 0064). Nothing outside this module
 * names a zone.
 */
export const FALLBACK_TIME_ZONE = "Europe/Stockholm";

// An IANA name (`Area/Location` or `UTC`), never an offset such as `+01:00`.
const IANA_NAME = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)*$/;

/** An IANA time zone name the runtime knows, e.g. `Europe/Stockholm` (ADR 0064). */
export const TimeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine((value) => IANA_NAME.test(value) && isValidTimeZone({ timeZone: value }), {
    message: "Not a known IANA time zone",
  })
  .describe("IANA time zone name, e.g. Europe/Stockholm");

export type EffectiveTimeZoneInput = {
  /** The venue the time belongs to; its `null` zone inherits the organization's. */
  venue?: { timeZone: string | null } | null;
  /** The organization's profile; missing = `FALLBACK_TIME_ZONE`. */
  organization?: { timeZone: string } | null;
};

/**
 * THE zone resolver (ADR 0064 decisions 3 and 4): the venue's own zone, else the organization's,
 * else the fallback. Lines, occupancy and the calendar pass their venue; ticket-level times and
 * anything without a venue pass only the organization.
 */
export function effectiveTimeZone({ venue, organization }: EffectiveTimeZoneInput): string {
  return venue?.timeZone ?? organization?.timeZone ?? FALLBACK_TIME_ZONE;
}

/** Every IANA zone the runtime knows, for pickers. */
export function listTimeZones(): string[] {
  return Intl.supportedValuesOf("timeZone");
}
