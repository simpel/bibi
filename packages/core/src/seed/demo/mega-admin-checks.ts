import type { Db } from "@okazi/db";
import { MEGA_ADMIN_EMAIL } from "./seed-mega-admin";

export type CheckMegaAdminInput = {
  db: Db;
  organizationIds: readonly string[];
  email?: string;
};

/** The mega admin is a platform admin and the owner of every given organization. */
export async function checkDemoMegaAdmin({
  db,
  organizationIds,
  email = MEGA_ADMIN_EMAIL,
}: CheckMegaAdminInput): Promise<string[]> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return [`${email}: not seeded`];
  const failures = user.role === "admin" ? [] : [`${email}: not a platform admin`];
  for (const organizationId of organizationIds) {
    const member = await db.member.findFirst({ where: { organizationId, userId: user.id } });
    if (member?.role !== "owner") failures.push(`${email}: not owner of ${organizationId}`);
  }
  return failures;
}
