import type { Db } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { OWNER_ROLE } from "../../permissions/resources";

/** Reserved TLD like the other demo users (`docs/demo-seed.md`): mail never leaves Mailpit. */
export const MEGA_ADMIN_EMAIL = "mega.admin@admin.okazi.test";

/** `user.role` of a platform admin (ADR 0015); the same value `@okazi/auth` grants. */
const PLATFORM_ADMIN_ROLE = "admin";

export type SeedMegaAdminInput = {
  db: Db;
  organizationIds: readonly string[];
  /** Only tests pass another address, so they never touch the real dev user. */
  email?: string;
};

/**
 * The seeded "mega admin": a platform admin (`/admin`) who is also the owner of every demo
 * organization, for development. Created once and kept across reseeds (the id stays, so the dev
 * session survives); only the memberships are rebuilt because deleting an organization removes
 * them. Written directly like the other users (ADR 0025): they are Better Auth's rows.
 */
export async function seedMegaAdmin({
  db,
  organizationIds,
  email = MEGA_ADMIN_EMAIL,
}: SeedMegaAdminInput): Promise<void> {
  const data = { name: "Mega Admin", emailVerified: true, role: PLATFORM_ADMIN_ROLE };
  const user = await db.user.upsert({
    where: { email },
    create: { id: createId(), email, ...data },
    update: data,
  });
  for (const organizationId of organizationIds) {
    const where = { organizationId, userId: user.id };
    if (await db.member.findFirst({ where })) continue;
    await db.member.create({
      data: { id: createId(), ...where, role: OWNER_ROLE, createdAt: new Date() },
    });
  }
}
