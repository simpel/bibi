import { listMembers } from "../../features/member/operations";
import { getMemberProfile } from "../../features/member-profile/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoMemberProfilesInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0068: each member in the data files' `staff` has the documented schedule kind and exactly
 * the linked staff items, and a linked item reads back as that member's.
 */
export async function checkDemoMemberProfiles({
  context,
  org,
}: CheckDemoMemberProfilesInput): Promise<string[]> {
  const failures: string[] = [];
  const members = await execute({ operation: listMembers, input: { limit: 100 }, context });
  if (!members.ok) return [`${org.slug}: could not read members`];
  for (const { member, scheduleKind = "PATTERN", items } of org.staff ?? []) {
    const memberId = members.value.items.find((candidate) => candidate.name === member)?.id;
    const input = { memberId: memberId ?? "" };
    const profile = await execute({ operation: getMemberProfile, input, context });
    if (!memberId || !profile.ok) {
      failures.push(`${org.slug}: could not read the profile of ${member}`);
      continue;
    }
    const linked = profile.value.items.map((item) => item.name).sort();
    if (linked.join("|") !== [...items].sort().join("|")) {
      failures.push(`${org.slug}: ${member} is linked to ${linked.join(", ") || "no items"}`);
    }
    if (profile.value.scheduleKind !== scheduleKind) {
      failures.push(`${org.slug}: ${member} has schedule ${profile.value.scheduleKind}`);
    }
  }
  return failures;
}
