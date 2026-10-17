import { type FixedRole, type PermissionSet, parseMemberRole } from "@okazi/core";
import { getDb } from "@okazi/db";
import { rolePermissions } from "../roles/role-permissions";

/** `role` is `null` when the stored role is not a fixed role; it then grants nothing. */
export type Membership = { role: FixedRole | null; roles: string[]; permissions: PermissionSet };

export type LoadMembershipInput = { userId: string; organizationId: string };

/**
 * The user's fixed role in the organization and what it grants (ADR 0034), or `null` when the
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
  const role = parseMemberRole({ role: member.role });
  return { role, roles: role ? [role] : [], permissions: rolePermissions({ role }) };
}
