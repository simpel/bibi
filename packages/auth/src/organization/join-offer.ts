import { joinDomainOffer } from "@bibi/core/domain-join";
import { getLogger } from "@bibi/logger";

export type JoinOfferInput = { userId: string; organizationId: string };

/** The user clicked Join on a domain offer (ADR 0076); false when it is no longer offered. */
export async function joinOffer({ userId, organizationId }: JoinOfferInput): Promise<boolean> {
  const joined = await joinDomainOffer({ userId, organizationId });
  if (joined) getLogger().info({ event: "auth.domainJoined", organizationId, userId });
  return joined;
}
