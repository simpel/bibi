import { listMembers } from "../../features/member/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { checkDemoAssignments } from "./assignment-checks";
import { checkDemoConfig } from "./config-checks";
import { checkDemoTickets } from "./ticket-checks";
import type { DemoOrg } from "./types";

export type CheckDemoOrgInput = { context: ExecuteContext; org: DemoOrg };

/**
 * The checks in `docs/demo-seed.md` that slices 1–5 can verify: the member count, everyone
 * has their documented role, the configuration and items (`checkDemoConfig`), the phases and
 * tickets per phase (`checkDemoTickets`), the tickets' assignees and followers
 * (`checkDemoAssignments`), and every write
 * was audited as SYSTEM. Returns failure messages.
 */
export async function checkDemoOrg({ context, org }: CheckDemoOrgInput): Promise<string[]> {
  const failures: string[] = [];
  const members = await execute({ operation: listMembers, input: { limit: 100 }, context });
  if (!members.ok) return [`${org.slug}: could not read members`];
  if (members.value.items.length !== org.users.length) {
    failures.push(
      `${org.slug}: ${members.value.items.length} members, expected ${org.users.length}`,
    );
  }
  for (const user of org.users) {
    const member = members.value.items.find((candidate) => candidate.name === user.name);
    if (member?.role !== user.role) {
      failures.push(`${org.slug}: ${user.name} has ${member ? member.role : "no member"}`);
    }
  }
  failures.push(...(await checkDemoConfig({ context, org })));
  failures.push(...(await checkDemoTickets({ context, org })));
  failures.push(...(await checkDemoAssignments({ context, org })));

  // Check 7 (ADR 0025): every write (organization-scoped) must have an audit row as SYSTEM.
  const notSystem = await context.db.auditLog.count({
    where: { organizationId: context.organizationId, actorType: { not: "SYSTEM" } },
  });
  if (notSystem > 0) failures.push(`${org.slug}: ${notSystem} audit rows not by SYSTEM`);

  return failures;
}
