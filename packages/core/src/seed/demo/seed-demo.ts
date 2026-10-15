import { type Db, getDb } from "@okazi/db";
import { getLogger } from "@okazi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { provisionOrganization } from "../../organization/provision";
import { grantAll } from "../../permissions/permission-set";
import { checkDemoOrg } from "./checks";
import { lindholmen } from "./data/lindholmen/lindholmen";
import { vingaleden } from "./data/vingaleden/vingaleden";
import { refuseProduction } from "./guard";
import { resetDemoOrg } from "./reset";
import { seedDemoBookings } from "./seed-bookings";
import { seedDemoConfig } from "./seed-config";
import { seedDemoCustomers } from "./seed-customers";
import { seedDemoItems } from "./seed-items";
import { seedDemoRoles } from "./seed-roles";
import type { DemoOrg } from "./types";
import { bootstrapDemoOrg } from "./users";

/** The demo organizations, in seed order (`docs/demo-seed.md`). */
export const DEMO_ORGS: readonly DemoOrg[] = [lindholmen, vingaleden];

/** Parts of the demo seed (ADR 0025). Each part is seeded when the corresponding operations exist. */
export const DEMO_SEED_PARTS = [
  { part: 1, name: "Custom roles" },
  { part: 2, name: "Configurable domain (types, fields, vocabularies, setups, behaviors)" },
  { part: 3, name: "Items and composition" },
  { part: 4, name: "Customers, price lists and sales pipeline" },
  { part: 5, name: "Bookings, custom statuses, program and requirements" },
  { part: 6, name: "Sheets with matching and blocking" },
  { part: 7, name: "Series" },
  { part: 8, name: "Export" },
] as const;

export type SeedDemoInput = { db?: Db; orgs?: readonly DemoOrg[] };

export type SeedDemoOutput = { organizations: { slug: string; organizationId: string }[] };

type SeedOneInput = { db: Db; org: DemoOrg };

type PostSeedInput = {
  context: ReturnType<typeof createExecuteContext>;
  org: DemoOrg;
  ranParts: ReadonlySet<number>;
};

async function postSeedLogging({ context, org, ranParts }: PostSeedInput): Promise<Result<null>> {
  const log = getLogger();
  for (const { part, name } of DEMO_SEED_PARTS) {
    if (!ranParts.has(part)) log.info({ event: "seed.sliceSkipped", part, name });
  }
  const auditRowCount = await context.db.auditLog.count({
    where: { organizationId: context.organizationId, actorType: "SYSTEM" },
  });
  log.info({ event: "seed.auditCount", organizationId: context.organizationId, auditRowCount });
  const failures = await checkDemoOrg({ context, org });
  if (failures.length > 0) {
    const message = `Demo checks failed:\n${failures.join("\n")}`;
    return err({ error: new AppError({ code: "INTERNAL", message }) });
  }
  return ok({ value: null });
}

type SeedSlicesInput = {
  context: ReturnType<typeof createExecuteContext>;
  org: DemoOrg;
  members: Awaited<ReturnType<typeof bootstrapDemoOrg>>["members"];
  userIds: Awaited<ReturnType<typeof bootstrapDemoOrg>>["userIds"];
};

/** Runs the slices in order. Each reports its part number once it has run. */
async function seedSlices({
  context,
  org,
  members,
  userIds,
}: SeedSlicesInput): Promise<Result<ReadonlySet<number>>> {
  const ranParts = new Set<number>();
  const roles = await seedDemoRoles({ context, org, members });
  if (!roles.ok) return roles;
  ranParts.add(1);
  const refs = await seedDemoConfig({ context, config: org.config });
  if (!refs.ok) return refs;
  ranParts.add(2);
  const items = await seedDemoItems({ context, config: org.config, refs: refs.value });
  if (!items.ok) return items;
  ranParts.add(3);
  const customers = await seedDemoCustomers({
    context,
    customers: org.customers,
    refs: refs.value,
  });
  if (!customers.ok) return customers;
  ranParts.add(4);
  const bookings = await seedDemoBookings({
    context,
    bookings: org.bookings,
    refs: refs.value,
    userIds,
  });
  if (!bookings.ok) return bookings;
  ranParts.add(5);
  return ok({ value: ranParts });
}

async function seedOne({ db, org }: SeedOneInput): Promise<Result<string>> {
  await resetDemoOrg({ db, org });
  const { organizationId, members, userIds } = await bootstrapDemoOrg({ db, org });
  // What Better Auth's afterCreateOrganization hook does for a real signup.
  const provisioned = await provisionOrganization({ organizationId, db });
  if (!provisioned.ok) return provisioned;
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "system", userId: null },
    db,
  });
  const slices = await seedSlices({ context, org, members, userIds });
  if (!slices.ok) return slices;
  const postSeed = await postSeedLogging({ context, org, ranParts: slices.value });
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
}: SeedDemoInput = {}): Promise<Result<SeedDemoOutput>> {
  const allowed = refuseProduction();
  if (!allowed.ok) return allowed;
  const organizations: SeedDemoOutput["organizations"] = [];
  for (const org of orgs) {
    const seeded = await seedOne({ db, org });
    if (!seeded.ok) return seeded;
    organizations.push({ slug: org.slug, organizationId: seeded.value });
  }
  return ok({ value: { organizations } });
}
