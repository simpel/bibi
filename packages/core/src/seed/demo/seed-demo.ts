import { type Db, getDb } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { provisionOrganization } from "../../organization/provision";
import { grantAll } from "../../permissions/permission-set";
import { lindholmen } from "./data/lindholmen/lindholmen";
import { vingaleden } from "./data/vingaleden/vingaleden";
import type { DemoRefs } from "./demo-refs";
import { refuseProduction } from "./guard";
import { postSeedLogging } from "./post-seed";
import { resetDemoOrg } from "./reset";
import { runMegaAdmin } from "./run-mega-admin";
import { seedDemoConfig } from "./seed-config";
import { type DemoCatalog, seedDemoItems } from "./seed-items";
import { seedDemoPipeline } from "./seed-pipeline";
import { seedDemoResponsibilities } from "./seed-responsibilities";
import { seedDemoRoles } from "./seed-roles";
import { seedDemoSales } from "./seed-sales";
import type { DemoOrg } from "./types";
import { bootstrapDemoOrg } from "./users";

/** The demo organizations, in seed order (`docs/demo-seed.md`). */
export const DEMO_ORGS: readonly DemoOrg[] = [lindholmen, vingaleden];

export type SeedDemoInput = {
  db?: Db;
  orgs?: readonly DemoOrg[];
  /** `--skip-pipeline`: item types without phases, states or grid, for the first setup. */
  skipPipeline?: boolean;
  /** The mega admin (platform admin, owner of every org); on by default for the demo orgs only. */
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

type PipelineAndSalesInput = Omit<SeedSlicesInput, "members"> & {
  refs: DemoRefs;
  catalog: DemoCatalog;
};

/** The pipeline, then customers and tickets; without a pipeline (ADR 0044) only customers. */
async function seedPipelineAndSales({ skipPipeline, ...input }: PipelineAndSalesInput) {
  if (!skipPipeline) {
    const pipeline = await seedDemoPipeline({
      context: input.context,
      pipeline: input.org.pipeline,
    });
    if (!pipeline.ok) return pipeline;
  }
  return seedDemoSales({ ...input, skipPipeline });
}

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
  const provisioned = await provisionOrganization({ organizationId, db, pipeline: "none" });
  if (!provisioned.ok) return provisioned;
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "system", userId: null },
    db,
  });
  const slices = await seedSlices({ context, org, members, userIds, skipPipeline });
  if (!slices.ok) return slices;
  const ranParts = slices.value;
  const postSeed = await postSeedLogging({ context, org, ranParts, skipPipeline });
  if (!postSeed.ok) return postSeed;
  return ok({ value: organizationId });
}

/**
 * `pnpm --filter @okazi/core seed:demo` (ADR 0025): deletes and recreates the demo
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
  if (megaAdmin) {
    const organizationIds = organizations.map(({ organizationId }) => organizationId);
    const mega = await runMegaAdmin({ db, organizationIds });
    if (!mega.ok) return mega;
  }
  return ok({ value: { organizations } });
}
