import { listMembers } from "../../features/member/operations";
import { listRoles } from "../../features/role/read-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { OWNER_ROLE } from "../../permissions/resources";
import { getRoleTemplate } from "../../templates/roles/role-templates";
import { checkDemoConfig } from "./config-checks";
import type { DemoOrg } from "./types";

export type CheckDemoOrgInput = { context: ExecuteContext; org: DemoOrg };

const expectedRoleNames = ({ org }: { org: DemoOrg }): string[] => [
  OWNER_ROLE,
  ...org.templates.flatMap((key) => getRoleTemplate({ key }).roles.map((role) => role.name)),
  ...org.roles.map((role) => role.name),
];

const sameSet = ({ a, b }: { a: readonly string[]; b: readonly string[] }) =>
  a.length === b.length && [...a].sort().every((value, i) => value === [...b].sort()[i]);

/**
 * The checks in `docs/demo-seed.md` that slices 1–2 can verify: role and member counts, everyone
 * has their documented role, the configuration and items (`checkDemoConfig`), and every write
 * was audited as SYSTEM. Returns failure messages.
 */
export async function checkDemoOrg({ context, org }: CheckDemoOrgInput): Promise<string[]> {
  const failures: string[] = [];
  const roles = await execute({ operation: listRoles, input: { limit: 100 }, context });
  const members = await execute({ operation: listMembers, input: { limit: 100 }, context });
  if (!roles.ok || !members.ok) return [`${org.slug}: could not read roles or members`];
  const roleNames = roles.value.items.map((role) => role.name);
  if (!sameSet({ a: roleNames, b: expectedRoleNames({ org }) })) {
    failures.push(`${org.slug}: roles are ${roleNames.join(", ")}`);
  }
  if (members.value.items.length !== org.users.length) {
    failures.push(
      `${org.slug}: ${members.value.items.length} members, expected ${org.users.length}`,
    );
  }
  for (const user of org.users) {
    const member = members.value.items.find((candidate) => candidate.name === user.name);
    if (!sameSet({ a: member?.roles ?? [], b: [user.role] })) {
      failures.push(`${org.slug}: ${user.name} has ${member?.roles.join(", ") ?? "no member"}`);
    }
  }
  failures.push(...(await checkDemoConfig({ context, org })));
  const notSystem = await context.db.auditLog.count({ where: { actorType: { not: "SYSTEM" } } });
  if (notSystem > 0) failures.push(`${org.slug}: ${notSystem} audit rows not by SYSTEM`);
  return failures;
}
