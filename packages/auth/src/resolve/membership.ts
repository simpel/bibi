import { type PermissionSet, splitMemberRoles } from "@okazi/core";
import { getDb } from "@okazi/db";
import { resolveRolePermissions } from "./role-permissions";

export type Membership = { roles: string[]; permissions: PermissionSet };

export type LoadMembershipInput = { userId: string; organizationId: string };

/**
 * The user's roles in the organization and what they resolve to (ADR 0014), or `null` when the
 * user is not a member. Read live on every request, so role changes apply immediately.
 */
export async function loadMembership({
  userId,
  organizationId,
}: LoadMembershipInput): Promise<Membership | null> {
  const member = await getDb().member.findFirst({
    where: { userId, organizationId },
    select: { role: true },
  });
  if (!member) return null;
  const roles = splitMemberRoles({ role: member.role });
  const permissions = await resolveRolePermissions({ organizationId, roles });
  return { roles, permissions };
}
