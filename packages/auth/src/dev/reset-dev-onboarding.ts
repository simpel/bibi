import { type Db, getDb } from "@bibi/db";
import { DEV_EMAIL_SUFFIX, isDevEnvironment } from "./dev-users";

export type ResetDevOnboardingInput = { userId: string };

type ActiveOrganizationInput = { db: Db; userId: string };

/** The organization the user works in: their newest session's active one, else any membership. */
async function activeOrganizationId({
  db,
  userId,
}: ActiveOrganizationInput): Promise<string | null> {
  const session = await db.session.findFirst({
    where: { userId, activeOrganizationId: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { activeOrganizationId: true },
  });
  if (session?.activeOrganizationId) return session.activeOrganizationId;
  const member = await db.member.findFirst({ where: { userId }, select: { organizationId: true } });
  return member?.organizationId ?? null;
}

/**
 * Dev switcher: puts the first setup of a seeded dev user's active organization back to PENDING
 * (ADR 0061), so the next page they open sends them through the welcome flow again. Dev tooling
 * only: it writes the organization profile directly, outside any operation. No-op (false) outside
 * development and for anyone who is not a seeded dev user.
 */
export async function resetDevOnboarding({ userId }: ResetDevOnboardingInput): Promise<boolean> {
  if (!isDevEnvironment()) return false;
  const db = getDb();
  const user = await db.user.findFirst({
    where: { id: userId, email: { endsWith: DEV_EMAIL_SUFFIX } },
    select: { id: true },
  });
  if (!user) return false;
  const organizationId = await activeOrganizationId({ db, userId });
  if (!organizationId) return false;
  await db.organizationProfile.upsert({
    where: { organizationId },
    create: { organizationId, setupStatus: "PENDING" },
    update: { setupStatus: "PENDING" },
  });
  return true;
}
