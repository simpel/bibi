import type { Db } from "@bibi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { provisionOrganization } from "../../organization/provision";
import { kvarnby } from "./data/kvarnby/kvarnby";
import { resetDemoOrg } from "./reset";
import { bootstrapDemoOrg, demoCreator } from "./users";

export type SeedBlankOrgInput = { db: Db };

type CheckBlankOrgInput = { db: Db; organizationId: string };

/** The blank organization is exactly a fresh sign-up: setup pending, one admin, no catalog or orders. */
async function checkBlankOrg({ db, organizationId }: CheckBlankOrgInput): Promise<string[]> {
  const where = { organizationId };
  const [profile, members, items, orders] = await Promise.all([
    db.organizationProfile.findFirst({ where }),
    db.member.count({ where }),
    db.item.count({ where }),
    db.order.count({ where }),
  ]);
  const failures: string[] = [];
  if (profile?.setupStatus !== "PENDING") failures.push("setup is not PENDING");
  if (members !== kvarnby.users.length) failures.push(`${members} members`);
  if (items > 0) failures.push(`${items} items`);
  if (orders > 0) failures.push(`${orders} orders`);
  return failures.map((failure) => `${kvarnby.slug}: ${failure}`);
}

/**
 * Kvarnby Manor, the organization that has set up nothing yet: its Better Auth rows, then
 * `provisionOrganization` with its defaults, the same way a real sign-up runs it (ADR 0061).
 */
export async function seedBlankOrg({
  db,
}: SeedBlankOrgInput): Promise<Result<{ slug: string; organizationId: string }>> {
  await resetDemoOrg({ db, org: kvarnby });
  const { organizationId, userIds } = await bootstrapDemoOrg({ db, org: kvarnby });
  const creator = demoCreator({ org: kvarnby, userIds });
  const provisioned = await provisionOrganization({
    organizationId,
    timeZone: kvarnby.timeZone,
    db,
    ...(creator ? { creator } : {}),
  });
  if (!provisioned.ok) return provisioned;
  const failures = await checkBlankOrg({ db, organizationId });
  if (failures.length > 0) {
    const message = `Demo checks failed:\n${failures.join("\n")}`;
    return err({ error: new AppError({ code: "INTERNAL", message }) });
  }
  return ok({ value: { slug: kvarnby.slug, organizationId } });
}
