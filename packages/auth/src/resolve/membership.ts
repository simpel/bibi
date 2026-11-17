import type { PermissionSet } from "@bibi/core";
import {
  ALL_RECORDS,
  type FixedRole,
  parseMemberRole,
  type RecordScopes,
  resolveSubjectAccess,
} from "@bibi/core";
import { getDb } from "@bibi/db";

/** `preset` is `null` when the stored role is not a preset; it then grants nothing. */
export type Membership = {
  preset: FixedRole | null;
  roles: string[];
  permissions: PermissionSet;
  scopes: RecordScopes;
};

export type LoadMembershipInput = { userId: string; organizationId: string };

/**
 * The user's preset in the organization, their overrides and record scopes (ADR 0050, 0113), or
 * `null` when the user is not a member. Read live on every request, so changes apply immediately.
 */
export async function loadMembership({
  userId,
  organizationId,
}: LoadMembershipInput): Promise<Membership | null> {
  const db = getDb();
  const member = await db.member.findFirst({
    where: { userId, organizationId },
    select: { id: true, role: true },
  });
  if (!member) return null;
  const preset = parseMemberRole({ role: member.role });
  const access = await resolveSubjectAccess({
    ...{ db, organizationId, subjectKind: "member", subjectId: member.id, preset },
  });
  return { ...access, roles: preset ? [preset] : [] };
}

/** A principal's access from its membership; a non-member gets nothing and sees nothing limited. */
export const memberAccess = ({ membership }: { membership: Membership | null }) => ({
  roles: membership?.roles ?? null,
  preset: membership?.preset ?? null,
  permissions: membership?.permissions ?? {},
  scopes: membership?.scopes ?? ALL_RECORDS,
});
