import type { Db } from "@bibi/db";

export type MemberOrganizationInput = { db: Db; userId: string; organizationId: unknown };

/**
 * `organizationId` when the user is a member of it, else `undefined`. A session can keep an
 * active organization the user has left (or that was deleted); an OAuth token for it would be
 * refused on every MCP call.
 */
export async function memberOrganization({
  db,
  userId,
  organizationId,
}: MemberOrganizationInput): Promise<string | undefined> {
  if (typeof organizationId !== "string" || organizationId.length === 0) return undefined;
  const member = await db.member.findFirst({
    where: { userId, organizationId },
    select: { organizationId: true },
  });
  return member?.organizationId;
}
