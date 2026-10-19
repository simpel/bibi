import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { assignMemberRole } from "../../features/member/operations";
import { updatePermissions } from "../../features/permission/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { ADMIN_ROLE } from "../../permissions/fixed-roles";
import type { DemoOrg, DemoUser } from "./types";
import type { DemoMembers } from "./users";

export type SeedDemoRolesInput = { context: ExecuteContext; org: DemoOrg; members: DemoMembers };

type SeedUserInput = { context: ExecuteContext; id: string; user: DemoUser };

/** The user's preset (admins already have theirs) and their overrides (ADR 0050). */
async function seedUser({ context, id, user }: SeedUserInput): Promise<Result<unknown>> {
  if (user.role !== ADMIN_ROLE) {
    const input = { id, role: user.role };
    const assigned = await execute({ operation: assignMemberRole, input, context });
    if (!assigned.ok) return assigned;
  }
  if (!user.overrides?.length) return ok({ value: true });
  const input = { subjectType: "member" as const, subjectId: id, overrides: [...user.overrides] };
  return execute({ operation: updatePermissions, input, context });
}

/** Slice 1 of ADR 0025: every member gets their preset and overrides via `execute`. */
export async function seedDemoRoles({
  context,
  org,
  members,
}: SeedDemoRolesInput): Promise<Result<true>> {
  for (const user of org.users) {
    const id = members.get(user.name);
    if (!id) {
      const message = `No member for ${user.name}`;
      return err({ error: new AppError({ code: "INTERNAL", message }) });
    }
    const seeded = await seedUser({ context, id, user });
    if (!seeded.ok) return seeded;
  }
  return ok({ value: true });
}
