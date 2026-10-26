import { type Db, getDb } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { provisionOrganization } from "../../organization/provision";
import { grantAll } from "../../permissions/permission-set";
import { lindholmen } from "./data/lindholmen/lindholmen";
import { vingaleden } from "./data/vingaleden/vingaleden";
import { refuseProduction } from "./guard";
import { postSeedLogging } from "./post-seed";
import { resetDemoOrg } from "./reset";
import { runPlatformSeed } from "./run-platform-seed";
import { seedDemoConfig } from "./seed-config";
import { seedDemoItems } from "./seed-items";
import { seedPipelineAndSales } from "./seed-pipeline-and-sales";
import { seedDemoProfiles } from "./seed-profiles";
import { seedDemoResponsibilities } from "./seed-responsibilities";
import { seedDemoRoles } from "./seed-roles";
import { seedSharedMember } from "./seed-shared-member";
import { seedDemoStaff } from "./seed-staff";
import type { DemoOrg } from "./types";
import { bootstrapDemoOrg } from "./users";

/** The demo organizations, in seed order (`docs/demo-seed.md`). */
export const DEMO_ORGS: readonly DemoOrg[] = [lindholmen, vingaleden];

export type SeedDemoInput = {
  db?: Db;
  orgs?: readonly DemoOrg[];
  /** `--skip-pipeline`: item types without statuses, states or grid, for the first setup. */
  skipPipeline?: boolean;
  /** The mega admin (superadmin, admin of every org); on by default for the demo orgs only. */
  megaAdmin?: boolean;
};

export type SeedDemoOutput = { organizations: { slug: string; organizationId: string }[] };

type SeedOneInput = { db: Db; org: DemoOrg; skipPipeline: boolean };

type SeedSlicesInput = {
  context: ReturnType<typeof createExecuteContext>;
  org: DemoOrg;
  members: Awaited<ReturnType<typeof bootstrapDemoOrg>>["members"];
  userIds: Awaited<ReturnType<typeof bootstrapDemoOrg>>["userIds"];
  skipPipeline: boolean;
};

/** Runs the slices in order. Each reports its part number once it has run. */
async function seedSlices({
  context,
  org,
  members,
  userIds,
  skipPipeline,
}: SeedSlicesInput): Promise<Result<ReadonlySet<number>>> {
  const ranParts = new Set<number>();
  const roles = await seedDemoRoles({ context, org, members });
  if (!roles.ok) return roles;
  ranParts.add(1);
  const refs = await seedDemoConfig({ context, config: org.config, skipStates: skipPipeline });
  if (!refs.ok) return refs;
  const responsibilities = await seedDemoResponsibilities({
    context,
    org,
    refs: refs.value,
    userIds,
  });
  if (!responsibilities.ok) return responsibilities;
  ranParts.add(2);
  const items = await seedDemoItems({ context, config: org.config, refs: refs.value });
  if (!items.ok) return items;
  const staff = await seedDemoStaff({ context, org, members, items: items.value.items });
  if (!staff.ok) return staff;
  ranParts.add(3);
  const sales = await seedPipelineAndSales({
    ...{ context, org, userIds, skipPipeline },
    refs: refs.value,
    catalog: items.value,
  });
  if (!sales.ok) return sales;
  ranParts.add(4);
  if (!skipPipeline) ranParts.add(5);
  return ok({ value: ranParts });
}

async function seedOne({ db, org, skipPipeline }: SeedOneInput): Promise<Result<string>> {
  await resetDemoOrg({ db, org });
  const { organizationId, members, userIds } = await bootstrapDemoOrg({ db, org });
  // What Better Auth's afterCreateOrganization hook does for a real signup.
  // `--skip-pipeline` leaves the welcome setup to do (ADR 0061).
  const setupStatus = skipPipeline ? "PENDING" : "COMPLETED";
  const provisioned = await provisionOrganization({
    organizationId,
    timeZone: org.timeZone,
    db,
    pipeline: "none",
    setupStatus,
  });
  if (!provisioned.ok) return provisioned;
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    db,
  });
  const profiles = await seedDemoProfiles({ db, context, org, userIds });
  if (!profiles.ok) return profiles;
  const slices = await seedSlices({ context, org, members, userIds, skipPipeline });
  if (!slices.ok) return slices;
  const ranParts = slices.value;
  const postSeed = await postSeedLogging({ context, org, ranParts, skipPipeline });
  if (!postSeed.ok) return postSeed;
  return ok({ value: organizationId });
}

/**
 * `pnpm --filter @bibi/core seed:demo` (ADR 0025): deletes and recreates the demo
 * organizations through core operations as SYSTEM, then runs the checks. Refuses production.
 */
export async function seedDemo({
  db = getDb(),
  orgs = DEMO_ORGS,
  skipPipeline = false,
  megaAdmin = orgs === DEMO_ORGS,
}: SeedDemoInput = {}): Promise<Result<SeedDemoOutput>> {
  const allowed = refuseProduction();
  if (!allowed.ok) return allowed;
  const organizations: SeedDemoOutput["organizations"] = [];
  for (const org of orgs) {
    const seeded = await seedOne({ db, org, skipPipeline });
    if (!seeded.ok) return seeded;
    organizations.push({ slug: org.slug, organizationId: seeded.value });
  }
  const shared = await seedSharedMember({
    db,
    seeded: organizations.map(({ slug, organizationId }) => ({
      org: orgs.find((org) => org.slug === slug) as DemoOrg,
      organizationId,
    })),
  });
  if (!shared.ok) return shared;
  if (megaAdmin) {
    const organizationIds = organizations.map(({ organizationId }) => organizationId);
    const platform = await runPlatformSeed({ db, organizationIds });
    if (!platform.ok) return platform;
  }
  return ok({ value: { organizations } });
}
