import type { ExecuteContext } from "../../operations/context";
import { checkDemoChoices } from "./choice-checks";
import type { DemoOrg } from "./types";

export type CheckDemoAssignmentsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0034: every seeded order with an assignee has a main assignment, and the followers add
 * up. Returns failure messages.
 */
export async function checkDemoAssignments({
  context,
  org,
}: CheckDemoAssignmentsInput): Promise<string[]> {
  const where = { record: { base: "ORDER" as const }, responsibilityId: null };
  const assigned = await context.db.assignment.count({
    where: { ...where, assigneeId: { not: null } },
  });
  const followers = await context.db.assignmentFollower.count({
    where: { assignment: where },
  });
  const expected = {
    assigned: org.orders.filter((order) => order.assignee).length,
    followers: org.orders.reduce((sum, order) => sum + (order.followers?.length ?? 0), 0),
  };
  const failures: string[] = [];
  if (assigned !== expected.assigned) {
    failures.push(`${org.slug}: ${assigned} assigned orders, expected ${expected.assigned}`);
  }
  if (followers !== expected.followers) {
    failures.push(`${org.slug}: ${followers} order followers, expected ${expected.followers}`);
  }
  failures.push(...(await checkDemoChoices({ context, org })));
  return failures;
}
