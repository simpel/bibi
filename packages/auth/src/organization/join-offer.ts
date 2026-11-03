import { joinDomainOffer } from "@bibi/core/domain-join";
import { getLogger } from "@bibi/logger";
import { sendSeatRequestMail } from "../billing/seat-request-mail";

export type JoinOfferInput = { userId: string; organizationId: string };

export type JoinOfferOutcome = Awaited<ReturnType<typeof joinDomainOffer>>;

/**
 * The user clicked Join on a domain offer (ADR 0078). `held`: every seat is taken and an admin
 * must approve (ADR 0095 §6), so the admins are mailed; `refused`: it is no longer offered.
 */
export async function joinOffer({
  userId,
  organizationId,
}: JoinOfferInput): Promise<JoinOfferOutcome> {
  const outcome = await joinDomainOffer({ userId, organizationId });
  if (outcome === "joined")
    getLogger().info({ event: "auth.domainJoined", organizationId, userId });
  if (outcome === "held") await sendSeatRequestMail({ organizationId, requesterId: userId });
  return outcome;
}
