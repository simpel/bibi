import { getDb } from "@bibi/db";
import { DEV_EMAIL_SUFFIX, isDevEnvironment } from "./dev-users";

export type ResetDevOnboardingInput = { userId: string };

/**
 * Dev switcher: puts a seeded dev user's first setup back to PENDING (ADR 0046), so the next page
 * they open sends them through the onboarding again. Dev tooling only: it writes another user's
 * settings row directly, which no operation may do. No-op (false) outside development and for
 * anyone who is not a seeded dev user.
 */
export async function resetDevOnboarding({ userId }: ResetDevOnboardingInput): Promise<boolean> {
  if (!isDevEnvironment()) return false;
  const db = getDb();
  const user = await db.user.findFirst({
    where: { id: userId, email: { endsWith: DEV_EMAIL_SUFFIX } },
    select: { id: true },
  });
  if (!user) return false;
  await db.userSettings.upsert({
    where: { userId },
    create: { userId, onboardingStatus: "PENDING" },
    update: { onboardingStatus: "PENDING" },
  });
  return true;
}
