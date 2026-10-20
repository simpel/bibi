import { applyOverrides, type FixedRole, type PermissionSet, parseMemberRole } from "@okazi/core";
import { getDb } from "@okazi/db";
import { loadSubjectOverrides } from "./load-overrides";

/** `role` is `null` when the stored role is not a preset; it then grants nothing. */
export type Membership = { role: FixedRole | null; roles: string[]; permissions: PermissionSet };

export type LoadMembershipInput = { userId: string; organizationId: string };

/**
 * The user's preset in the organization plus their overrides (ADR 0050), or `null` when the user
 * is not a member. Read live on every request, so changes apply immediately.
 */
export async function loadMembership({
  userId,
  organizationId,
}: LoadMembershipInput): Promise<Membership | null> {
  const member = await getDb().member.findFirst({
    where: { userId, organizationId },
    select: { id: true, role: true },
  });
  if (!member) return null;
  const role = parseMemberRole({ role: member.role });
  const subject = { organizationId, subjectType: "MEMBER" as const, subjectId: member.id };
  const overrides = await loadSubjectOverrides(subject);
  const permissions = applyOverrides({ preset: role, overrides });
  return { role, roles: role ? [role] : [], permissions };
}
