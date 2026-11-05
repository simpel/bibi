import { type DomainOffer, domainOffers } from "@bibi/core/domain-join";
import { type Db, getDb } from "@bibi/db";

export type JoinableInvitation = {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  inviterName?: string | null;
  inviterImage?: string | null;
  logo?: string | null;
};
export type JoinedOrganization = {
  organizationId: string;
  name: string;
  slug: string;
  primary: boolean;
  logo?: string | null;
};

export type JoinableOrganizations = {
  offers: DomainOffer[];
  invitations: JoinableInvitation[];
  memberships: JoinedOrganization[];
};

export type LoadJoinableOrganizationsInput = { userId: string; email: string; db?: Db };

/**
 * Everything `/welcome` offers a user (ADR 0078): organizations claiming their verified domain,
 * their pending invitations, and the organizations they already belong to.
 */
export async function loadJoinableOrganizations({
  userId,
  email,
  db = getDb(),
}: LoadJoinableOrganizationsInput): Promise<JoinableOrganizations> {
  const [offers, invitations, members] = await Promise.all([
    domainOffers({ userId, db }),
    db.invitation.findMany({
      where: {
        email: { equals: email, mode: "insensitive" },
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
        organization: { select: { name: true, logo: true } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.member.findMany({
      where: { userId },
      select: {
        organizationId: true,
        primary: true,
        organization: { select: { name: true, slug: true, logo: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return {
    offers,
    invitations: invitations.map(({ id, organizationId, role, organization, user }) => ({
      id,
      organizationId,
      name: organization.name,
      logo: organization.logo,
      role: role ?? "member",
      inviterName: user?.name || user?.email || null,
      inviterImage: user?.image || null,
    })),
    memberships: members.map(({ organizationId, primary, organization }) => ({
      organizationId,
      primary,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
    })),
  };
}
