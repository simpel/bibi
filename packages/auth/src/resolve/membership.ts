import { getDb } from "@okazi/db";
import type { OrgRole } from "../permissions";
import { parseRoles } from "../roles";

export type LoadMemberRolesInput = { userId: string; organizationId: string };

/** The user's roles in the organization (empty = not a member). Read live on every request. */
export async function loadMemberRoles({
  userId,
  organizationId,
}: LoadMemberRolesInput): Promise<OrgRole[]> {
  const member = await getDb().member.findFirst({
    where: { userId, organizationId },
    select: { role: true },
  });
  return member ? parseRoles({ role: member.role }) : [];
}
