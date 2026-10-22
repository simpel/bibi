import type { Db } from "@bibi/db";
import { SUPERADMIN_ROLE } from "../../permissions/fixed-roles";
import { MEGA_ADMIN_EMAIL } from "./seed-mega-admin";

export type CheckMegaAdminInput = {
  db: Db;
  organizationIds: readonly string[];
  email?: string;
};

/** The mega admin is a superadmin and an admin of every given organization. */
export async function checkDemoMegaAdmin({
  db,
  organizationIds,
  email = MEGA_ADMIN_EMAIL,
}: CheckMegaAdminInput): Promise<string[]> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return [`${email}: not seeded`];
  const failures = user.role === SUPERADMIN_ROLE ? [] : [`${email}: not a superadmin`];
  for (const organizationId of organizationIds) {
    const member = await db.member.findFirst({ where: { organizationId, userId: user.id } });
    if (member?.role !== "admin") failures.push(`${email}: not admin of ${organizationId}`);
  }
  return failures;
}
