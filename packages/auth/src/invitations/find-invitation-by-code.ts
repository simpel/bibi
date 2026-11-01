import { normalizeInvitationCode } from "@bibi/core/invitation-code";
import { type Db, getDb } from "@bibi/db";

export type FindInvitationByCodeInput = { code: string; email: string; db?: Db };

/**
 * The pending, unexpired invitation an invite code names (ADR 0078), only for the invited email:
 * a code alone never lets someone else in. The caller accepts it through Better Auth.
 */
export async function findInvitationByCode({
  code,
  email,
  db = getDb(),
}: FindInvitationByCodeInput): Promise<string | null> {
  const invitation = await db.invitation.findFirst({
    where: {
      code: normalizeInvitationCode({ code }),
      email: { equals: email, mode: "insensitive" },
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return invitation?.id ?? null;
}
