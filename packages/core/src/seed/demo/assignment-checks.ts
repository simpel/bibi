import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoAssignmentsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0034: every seeded booking with an assignee has a main assignment, and the followers add
 * up. Returns failure messages.
 */
export async function checkDemoAssignments({
  context,
  org,
}: CheckDemoAssignmentsInput): Promise<string[]> {
  const where = { subjectType: "BOOKING" as const, responsibilityId: null };
  const assigned = await context.db.assignment.count({
    where: { ...where, assigneeId: { not: null } },
  });
  const followers = await context.db.assignmentFollower.count({
    where: { assignment: where },
  });
  const expected = {
    assigned: org.bookings.filter((booking) => booking.assignee).length,
    followers: org.bookings.reduce((sum, booking) => sum + (booking.followers?.length ?? 0), 0),
  };
  const failures: string[] = [];
  if (assigned !== expected.assigned) {
    failures.push(`${org.slug}: ${assigned} assigned bookings, expected ${expected.assigned}`);
  }
  if (followers !== expected.followers) {
    failures.push(`${org.slug}: ${followers} booking followers, expected ${expected.followers}`);
  }
  return failures;
}
