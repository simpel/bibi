import { getEnv } from "@okazi/config";
import { SUPERADMIN_ROLE } from "@okazi/core";
import { DEMO_ORGS } from "@okazi/core/seed/demo";
import { getDb } from "@okazi/db";

/** Seeded demo users have `@<slug>.okazi.test` addresses (reserved TLD, docs/demo-seed.md). */
export const DEV_EMAIL_SUFFIX = ".okazi.test";

export type DevUser = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
};

/** Dev tooling (user switcher, startup banner) only runs in `next dev`, never in test/production. */
export function isDevEnvironment(): boolean {
  return getEnv().NODE_ENV === "development";
}

/**
 * Seeded dev users of the demo organizations (`DEMO_ORGS`), grouped by organization, oldest
 * membership first. Copies that test runs leave in the dev database (same names, suffixed slugs)
 * are left out. Empty outside dev.
 */
export async function listDevUsers(): Promise<DevUser[]> {
  if (!isDevEnvironment()) return [];
  const members = await getDb().member.findMany({
    where: {
      user: { email: { endsWith: DEV_EMAIL_SUFFIX } },
      organization: { slug: { in: DEMO_ORGS.map((org) => org.slug) } },
    },
    orderBy: [{ organization: { name: "asc" } }, { createdAt: "asc" }],
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
      organization: { select: { name: true } },
    },
  });
  return members.map(({ user, organization, role }) => ({
    ...user,
    organization: organization.name,
    role,
  }));
}

/**
 * Seeded superadmins (e.g. the mega admin of `seed:demo`), for a top-level entry of the dev
 * switcher. They belong to no single organization, so `organization` and `role` are placeholders.
 * Empty outside dev.
 */
export async function listDevPlatformAdmins(): Promise<DevUser[]> {
  if (!isDevEnvironment()) return [];
  const admins = await getDb().user.findMany({
    where: { role: SUPERADMIN_ROLE, email: { endsWith: DEV_EMAIL_SUFFIX } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  return admins.map((user) => ({ ...user, organization: "Platform", role: SUPERADMIN_ROLE }));
}
