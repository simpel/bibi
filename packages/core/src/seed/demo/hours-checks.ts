import { getVenueHours } from "../../features/venue/hours-operations";
import { listVenues } from "../../features/venue/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoHoursInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0064 rule 10: the demo venue has its structured opening hours, the weekly pattern and the
 * dated exception exactly as the data says, read back through `venueHours.get`.
 */
export async function checkDemoHours({ context, org }: CheckDemoHoursInput): Promise<string[]> {
  const venues = await execute({ operation: listVenues, input: { limit: 100 }, context });
  if (!venues.ok) return [`${org.slug}: could not list venues`];
  const { venue: wanted, venueHours } = org.config;
  const venue = venues.value.items.find((candidate) => candidate.name === wanted.name);
  if (!venue) return [`${org.slug}: venue ${wanted.name} missing`];
  const read = await execute({ operation: getVenueHours, input: { venueId: venue.id }, context });
  if (!read.ok) return [`${org.slug}: could not read the hours of ${wanted.name}`];
  const failures: string[] = [];
  const weekdays = read.value.days.map((day) => day.weekday).join(",");
  const expected = venueHours.days.map((day) => day.weekday).join(",");
  if (weekdays !== expected) {
    failures.push(
      `${org.slug}: ${wanted.name} is open on weekdays ${weekdays}, expected ${expected}`,
    );
  }
  const dates = read.value.exceptions.map((row) => row.date).join(",");
  const expectedDates = venueHours.exceptions.map((row) => row.date).join(",");
  if (dates !== expectedDates) {
    failures.push(`${org.slug}: ${wanted.name} has exceptions ${dates}, expected ${expectedDates}`);
  }
  return failures;
}
