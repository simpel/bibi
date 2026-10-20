import { getPermissions } from "../../features/permission/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoPermissionsInput = {
  context: ExecuteContext;
  org: DemoOrg;
  members: readonly { id: string; name: string }[];
};

/** Every documented override is stored for its member (ADR 0050, `docs/demo-seed.md`). */
export async function checkDemoPermissions({
  context,
  org,
  members,
}: CheckDemoPermissionsInput): Promise<string[]> {
  const failures: string[] = [];
  for (const user of org.users.filter((candidate) => candidate.overrides?.length)) {
    const member = members.find((candidate) => candidate.name === user.name);
    if (!member) continue;
    const input = { subjectType: "member" as const, subjectId: member.id };
    const profile = await execute({ operation: getPermissions, input, context });
    const stored = profile.ok ? profile.value.overrides.length : -1;
    if (stored !== user.overrides?.length) {
      failures.push(`${org.slug}: ${user.name} has ${stored} overrides`);
    }
  }
  return failures;
}
