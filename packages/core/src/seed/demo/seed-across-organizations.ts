import type { Db } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import { seedPendingInvitee } from "./seed-pending-invitee";
import { seedSharedMember } from "./seed-shared-member";
import type { DemoOrg } from "./types";

export type SeedAcrossOrganizationsInput = {
  db: Db;
  orgs: readonly DemoOrg[];
  organizations: readonly { slug: string; organizationId: string }[];
};

/**
 * People who span the demo organizations, seeded once every organization exists: Lena Strand in
 * both (#449) and Nora Vik, invited to Vingaleden with a Lindholmen address (ADR 0076).
 */
export async function seedAcrossOrganizations({
  db,
  orgs,
  organizations,
}: SeedAcrossOrganizationsInput): Promise<Result<null>> {
  const seeded = organizations.flatMap(({ slug, organizationId }) => {
    const org = orgs.find((candidate) => candidate.slug === slug);
    return org ? [{ org, organizationId }] : [];
  });
  for (const step of [seedSharedMember, seedPendingInvitee]) {
    const done = await step({ db, seeded });
    if (!done.ok) return done;
  }
  return ok({ value: null });
}
