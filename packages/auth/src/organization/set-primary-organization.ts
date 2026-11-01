import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";

export type SetPrimaryOrganizationInput = { userId: string; organizationId: string; db?: Db };

/**
 * Makes one of the user's memberships their primary organization (ADR 0078), where new sessions
 * start. False when they are not a member there. The old primary is cleared in the same
 * transaction, so the partial unique index never sees two.
 */
export async function setPrimaryOrganization({
  userId,
  organizationId,
  db = getDb(),
}: SetPrimaryOrganizationInput): Promise<boolean> {
  const set = await db.$transaction(async (tx) => {
    const member = await tx.member.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });
    if (!member) return false;
    await tx.member.updateMany({ where: { userId, primary: true }, data: { primary: false } });
    await tx.member.update({ where: { id: member.id }, data: { primary: true } });
    return true;
  });
  if (set) getLogger().info({ event: "auth.primaryOrganizationSet", organizationId, userId });
  return set;
}
