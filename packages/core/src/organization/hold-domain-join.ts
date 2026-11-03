import type { ScopedDbClient } from "@bibi/db";
import { getLogContext } from "@bibi/logger";
import { createId } from "@paralleldrive/cuid2";
import { newInvitationCode } from "../features/member/invitation-code";
import { INVITATION_TTL_MS } from "../features/member/to-invitation-dto";
import { MEMBER_ROLE } from "../permissions/fixed-roles";

/** `joined`: a member now. `held`: waits for an admin to approve a seat. `refused`: not offered. */
export type DomainJoinOutcome = "joined" | "held" | "refused";

export type HoldDomainJoinInput = {
  tx: ScopedDbClient;
  organizationId: string;
  userId: string;
  email: string;
};

/**
 * A domain join with no free seat (ADR 0095 §6) becomes a held invitation for the user, as if
 * they had invited themselves; approving it sends them the invitation mail.
 */
export async function holdDomainJoin({ tx, organizationId, userId, email }: HoldDomainJoinInput) {
  const now = new Date();
  const id = createId();
  await tx.invitation.create({
    data: {
      ...{ id, organizationId, email: email.toLowerCase(), role: MEMBER_ROLE, status: "held" },
      ...{ code: newInvitationCode(), inviterId: userId, createdAt: now },
      expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
    },
  });
  const { requestId = null, surface = "system" } = getLogContext() ?? {};
  await tx.auditLog.create({
    data: {
      ...{ organizationId, actorType: "SYSTEM", operation: "member.joinByDomain", requestId },
      ...{ surface, entityType: "invitation", entityId: id, after: { email, status: "held" } },
    },
  });
}
