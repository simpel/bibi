import { type Db, getDb, SYSTEM_ACTOR_ID, scopedDb } from "@bibi/db";
import { emailDomainOf } from "./email-domain";
import { joinOrganizationByDomain, mayJoin } from "./join-organization";

export type DomainOffersInput = {
  userId: string;
  /** Base client; defaults to the process singleton from `@bibi/db`. */
  db?: Db;
};

export type DomainOffer = { organizationId: string; name: string; slug: string; domain: string };

type VerifiedUser = { email: string; domain: string };

async function verifiedUser({
  userId,
  db,
}: {
  userId: string;
  db: Db;
}): Promise<VerifiedUser | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true },
  });
  const domain = user?.emailVerified ? emailDomainOf({ email: user.email }) : null;
  return user && domain ? { email: user.email, domain } : null;
}

/**
 * The organizations a user is offered by their verified work domain (ADR 0076): those claiming it
 * with domain join on, minus any they belong to, have belonged to or are invited to. The only
 * cross-organization read is which organizations claim the domain; each check is scoped.
 */
export async function domainOffers({
  userId,
  db = getDb(),
}: DomainOffersInput): Promise<DomainOffer[]> {
  const user = await verifiedUser({ userId, db });
  if (!user) return [];
  const claims = await db.organizationProfile.findMany({
    where: { emailDomain: user.domain, domainJoin: true, status: "ACTIVE" },
    select: { organizationId: true },
  });
  const ids = claims.map((claim) => claim.organizationId);
  const organizations = await db.organization.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  const offers: DomainOffer[] = [];
  for (const { id, name, slug } of organizations) {
    const tx = scopedDb({ organizationId: id, actorId: SYSTEM_ACTOR_ID, db });
    if (await mayJoin({ tx, organizationId: id, userId, email: user.email })) {
      offers.push({ organizationId: id, name, slug, domain: user.domain });
    }
  }
  return offers;
}

export type JoinDomainOfferInput = { userId: string; organizationId: string; db?: Db };

/** Joins one offered organization when the user clicks Join; false when it is not offered. */
export async function joinDomainOffer({
  userId,
  organizationId,
  db = getDb(),
}: JoinDomainOfferInput): Promise<boolean> {
  const user = await verifiedUser({ userId, db });
  if (!user) return false;
  const claim = await db.organizationProfile.findFirst({
    where: { organizationId, emailDomain: user.domain, domainJoin: true, status: "ACTIVE" },
    select: { id: true },
  });
  if (!claim) return false;
  return joinOrganizationByDomain({ organizationId, userId, email: user.email, db });
}
