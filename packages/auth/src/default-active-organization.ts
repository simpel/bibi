import type { Db } from "@bibi/db";

export type DefaultActiveOrganizationInput = { db: Db; userId: string };

/** On sign-in, start in the user's oldest organization so sessions rarely lack an org. */
export async function defaultActiveOrganization({
  db,
  userId,
}: DefaultActiveOrganizationInput): Promise<string | null> {
  const member = await db.member.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  return member?.organizationId ?? null;
}
