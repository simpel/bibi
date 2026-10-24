import { effectiveTimeZone } from "../../time/time-zone";
import type { DemoOrg } from "./types";

/** The zones a demo ticket's times are written in (ADR 0064 decision 4). */
export type DemoTimeZones = {
  /** Ticket-level times (`desired*`, `holdsUntil`): the organization's zone. */
  ticket: string;
  /** Lines: the zone of the organization's one demo venue. */
  lines: string;
};

/** Both zones through the resolver, from the demo data. */
export function demoTimeZones({ org }: { org: DemoOrg }): DemoTimeZones {
  const organization = { timeZone: org.timeZone };
  const venue = { timeZone: org.config.venue.timeZone ?? null };
  return {
    ticket: effectiveTimeZone({ organization }),
    lines: effectiveTimeZone({ venue, organization }),
  };
}
