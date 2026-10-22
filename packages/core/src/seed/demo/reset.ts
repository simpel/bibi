import type { Db } from "@bibi/db";
import { deleteOrganizations } from "./delete-organizations";
import type { DemoOrg } from "./types";
import { demoEmailDomain } from "./users";

export type ResetDemoOrgInput = { db: Db; org: DemoOrg };

/**
 * Deletes one demo organization and everything it owns, plus its demo users, so the seed can
 * recreate it (ADR 0025: idempotent per slug).
 */
export async function resetDemoOrg({ db, org }: ResetDemoOrgInput): Promise<void> {
  const existing = await db.organization.findFirst({ where: { slug: org.slug } });
  if (existing) await deleteOrganizations({ db, organizationIds: [existing.id] });
  await db.user.deleteMany({ where: { email: { endsWith: `@${demoEmailDomain({ org })}` } } });
}
