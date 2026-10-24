import { getOrganizationProfile } from "../../features/organization-profile/operations";
import { listVenues } from "../../features/venue/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { effectiveTimeZone } from "../../time/time-zone";
import type { DemoOrg } from "./types";

export type CheckDemoTimeZonesInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0064: the organization has its zone, and the demo venue stores its own zone only when the
 * data overrides it (otherwise `null`, inherited); the resolver gives the venue's zone.
 */
export async function checkDemoTimeZones({
  context,
  org,
}: CheckDemoTimeZonesInput): Promise<string[]> {
  const profile = await execute({ operation: getOrganizationProfile, input: {}, context });
  const venues = await execute({ operation: listVenues, input: { limit: 100 }, context });
  if (!profile.ok || !venues.ok) return [`${org.slug}: could not read the zones`];
  const failures: string[] = [];
  if (profile.value.timeZone !== org.timeZone) {
    failures.push(`${org.slug}: zone ${profile.value.timeZone}, expected ${org.timeZone}`);
  }
  const { name, timeZone = null } = org.config.venue;
  const venue = venues.value.items.find((candidate) => candidate.name === name);
  if (!venue) return [...failures, `${org.slug}: venue ${name} missing`];
  if (venue.timeZone !== timeZone) {
    failures.push(`${org.slug}: ${name} stores zone ${venue.timeZone}, expected ${timeZone}`);
  }
  const effective = effectiveTimeZone({ venue, organization: profile.value });
  if (effective !== (timeZone ?? org.timeZone)) {
    failures.push(`${org.slug}: ${name} resolves to ${effective}`);
  }
  return failures;
}
