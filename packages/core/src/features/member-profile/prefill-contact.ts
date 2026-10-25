import { type ScopedDbClient, scopedDb } from "@bibi/db";

type PrefillInput = { db: ScopedDbClient; userId: string };

/**
 * Fills the empty contact fields of the user's member profile in this organization from their
 * own `UserProfile` (ADR 0072): a starting point, never a sync, so nothing set here is overwritten.
 * `db` must act as `userId`: the user profile is only readable by its owner (ADR 0061).
 */
export async function prefillMemberContact({ db, userId }: PrefillInput): Promise<void> {
  const [profile, member] = await Promise.all([
    db.userProfile.findUnique({ where: { userId }, select: { phone: true, avatarKey: true } }),
    db.member.findFirst({ where: { userId }, select: { id: true, organizationId: true } }),
  ]);
  if (!profile || !member) return;
  const own = await db.memberProfile.findFirst({
    where: { memberId: member.id },
    select: { id: true, phone: true, avatarKey: true },
  });
  if (!own) {
    await db.memberProfile.create({
      data: { organizationId: member.organizationId, memberId: member.id, ...profile },
    });
    return;
  }
  const data = {
    ...(own.phone === null ? { phone: profile.phone } : {}),
    ...(own.avatarKey === null && profile.avatarKey ? { avatarKey: profile.avatarKey } : {}),
  };
  if (Object.keys(data).length > 0) await db.memberProfile.update({ where: { id: own.id }, data });
}

export type PrefillMemberProfileInput = { organizationId: string; userId: string };

/** `prefillMemberContact` for a user who just joined `organizationId` (Better Auth's hook). */
export const prefillMemberProfile = ({ organizationId, userId }: PrefillMemberProfileInput) =>
  prefillMemberContact({ db: scopedDb({ organizationId, actorId: userId }), userId });
