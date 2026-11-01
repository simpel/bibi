import { type Db, SYSTEM_ACTOR_ID, scopedDb } from "@bibi/db";

export type RecordKnownMemberInput = { organizationId: string; userId: string; db?: Db };

/**
 * Marks a user as having been a member of the organization (ADR 0078), so domain join never adds
 * them again after a removal. Idempotent. Called by Better Auth's member hooks.
 */
export async function recordKnownMember({
  organizationId,
  userId,
  db,
}: RecordKnownMemberInput): Promise<void> {
  const scoped = scopedDb({ organizationId, actorId: SYSTEM_ACTOR_ID, ...(db ? { db } : {}) });
  await scoped.knownMember.createMany({
    data: [{ organizationId, userId }],
    skipDuplicates: true,
  });
}
