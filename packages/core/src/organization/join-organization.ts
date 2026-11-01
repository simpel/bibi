import { type Db, type ScopedDbClient, SYSTEM_ACTOR_ID, scopedDb } from "@bibi/db";
import { getLogContext, getLogger } from "@bibi/logger";
import { createId } from "@paralleldrive/cuid2";
import { prefillMemberProfile } from "../features/member-profile/prefill-contact";
import { MEMBER_ROLE } from "../permissions/fixed-roles";

export type JoinOrganizationByDomainInput = {
  organizationId: string;
  userId: string;
  email: string;
  /** Base client; defaults to the process singleton from `@bibi/db`. */
  db?: Db;
};

export type MayJoinInput = {
  tx: ScopedDbClient;
  organizationId: string;
  userId: string;
  email: string;
};

/**
 * False for a member, a user who has been a member before (`KnownMember`) and a user with a
 * pending invitation (its role wins). A member found here is marked known, so a later removal
 * sticks. One query at a time: a transaction runs them in order anyway.
 */
export async function mayJoin({
  tx,
  organizationId,
  userId,
  email,
}: MayJoinInput): Promise<boolean> {
  if (await tx.member.findFirst({ where: { userId }, select: { id: true } })) {
    await tx.knownMember.createMany({ data: [{ organizationId, userId }], skipDuplicates: true });
    return false;
  }
  if (await tx.knownMember.findFirst({ where: { userId }, select: { id: true } })) return false;
  const invitation = await tx.invitation.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, status: "pending" },
    select: { id: true },
  });
  return !invitation;
}

/**
 * Adds a user to an organization that claims their email domain (ADR 0076), as `member`, with
 * its `KnownMember` row and a SYSTEM audit row in one transaction; true when they joined. Only
 * `joinDomainOffer` calls it, after checking the domain and the switch.
 */
export async function joinOrganizationByDomain({
  organizationId,
  userId,
  email,
  db,
}: JoinOrganizationByDomainInput): Promise<boolean> {
  const scoped = scopedDb({ organizationId, actorId: SYSTEM_ACTOR_ID, ...(db ? { db } : {}) });
  const { requestId = null, surface = "system" } = getLogContext() ?? {};
  const joined = await scoped.$transaction(async (tx) => {
    if (!(await mayJoin({ tx, organizationId, userId, email }))) return false;
    const row = { id: createId(), userId, role: MEMBER_ROLE, createdAt: new Date() };
    await tx.member.create({ data: { ...row, organizationId } });
    await tx.knownMember.create({ data: { organizationId, userId } });
    const after = { userId, role: MEMBER_ROLE };
    const audit = {
      actorType: "SYSTEM" as const,
      operation: "member.joinByDomain",
      requestId,
      surface,
    };
    const entity = { entityType: "member", entityId: row.id, after };
    await tx.auditLog.create({ data: { organizationId, ...audit, ...entity } });
    return true;
  });
  // The join stands either way; a missing prefill only leaves the contact fields empty.
  if (joined) {
    await prefillMemberProfile({ organizationId, userId }).catch((error: unknown) =>
      getLogger().warn({ event: "domainJoin.prefillFailed", organizationId, err: error }),
    );
  }
  return joined;
}
