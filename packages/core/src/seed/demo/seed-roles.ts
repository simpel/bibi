import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { assignMemberRole } from "../../features/member/operations";
import { importRoleTemplate } from "../../features/role/lifecycle-operations";
import { createRole } from "../../features/role/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { OWNER_ROLE } from "../../permissions/resources";
import type { DemoOrg } from "./types";
import type { DemoMembers } from "./users";

export type SeedDemoRolesInput = { context: ExecuteContext; org: DemoOrg; members: DemoMembers };

/** Slice 1 of ADR 0025: templates, custom roles and role assignment, all via `execute`. */
export async function seedDemoRoles({
  context,
  org,
  members,
}: SeedDemoRolesInput): Promise<Result<true>> {
  for (const template of org.templates) {
    const result = await execute({ operation: importRoleTemplate, input: { template }, context });
    if (!result.ok) return result;
  }
  for (const role of org.roles) {
    const result = await execute({ operation: createRole, input: role, context });
    if (!result.ok) return result;
  }
  for (const user of org.users.filter((candidate) => candidate.role !== OWNER_ROLE)) {
    const id = members.get(user.name);
    if (!id) {
      const message = `No member for ${user.name}`;
      return err({ error: new AppError({ code: "INTERNAL", message }) });
    }
    const input = { id, roles: [user.role] };
    const result = await execute({ operation: assignMemberRole, input, context });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
