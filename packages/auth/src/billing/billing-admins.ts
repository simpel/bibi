import { ADMIN_ROLE } from "@bibi/core";
import { getDb } from "@bibi/db";

export type BillingAudience = {
  organization: { name: string; slug: string };
  admins: { id: string; email: string; name: string }[];
};

/** The organization and its admins, the people who can pay or approve seats (ADR 0095). */
export async function billingAudience({
  organizationId,
}: {
  organizationId: string;
}): Promise<BillingAudience> {
  const db = getDb();
  const [organization, members] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { name: true, slug: true },
    }),
    db.member.findMany({
      where: { organizationId, role: ADMIN_ROLE },
      select: { user: { select: { id: true, email: true, name: true } } },
    }),
  ]);
  return { organization, admins: members.map((member) => member.user) };
}

/** The first name to greet with, or nothing for an empty name. */
export const greeting = ({ name }: { name: string }) => {
  const first = name.trim().split(/\s+/)[0];
  return first ? `Hi ${first},` : "Hi,";
};
