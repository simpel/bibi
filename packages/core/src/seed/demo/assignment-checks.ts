import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoAssignmentsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0034: every seeded ticket with an assignee has a main assignment, and the followers add
 * up. Returns failure messages.
 */
export async function checkDemoAssignments({
  context,
  org,
}: CheckDemoAssignmentsInput): Promise<string[]> {
  const where = { record: { base: "TICKET" as const }, responsibilityId: null };
  const assigned = await context.db.assignment.count({
    where: { ...where, assigneeId: { not: null } },
  });
  const followers = await context.db.assignmentFollower.count({
    where: { assignment: where },
  });
  const expected = {
    assigned: org.tickets.filter((ticket) => ticket.assignee).length,
    followers: org.tickets.reduce((sum, ticket) => sum + (ticket.followers?.length ?? 0), 0),
  };
  const failures: string[] = [];
  if (assigned !== expected.assigned) {
    failures.push(`${org.slug}: ${assigned} assigned tickets, expected ${expected.assigned}`);
  }
  if (followers !== expected.followers) {
    failures.push(`${org.slug}: ${followers} ticket followers, expected ${expected.followers}`);
  }
  return failures;
}
