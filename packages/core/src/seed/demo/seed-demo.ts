import { type Db, getDb } from "@okazi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { grantAll } from "../../permissions/permission-set";
import { checkDemoOrg } from "./checks";
import { lindholmen } from "./data/lindholmen";
import { vingaleden } from "./data/vingaleden";
import { refuseProduction } from "./guard";
import { resetDemoOrg } from "./reset";
import { seedDemoRoles } from "./seed-roles";
import type { DemoOrg } from "./types";
import { bootstrapDemoOrg } from "./users";

/** The demo organizations, in seed order (`docs/demo-seed.md`). */
export const DEMO_ORGS: readonly DemoOrg[] = [lindholmen, vingaleden];

export type SeedDemoInput = { db?: Db; orgs?: readonly DemoOrg[] };

export type SeedDemoOutput = { organizations: { slug: string; organizationId: string }[] };

type SeedOneInput = { db: Db; org: DemoOrg };

async function seedOne({ db, org }: SeedOneInput): Promise<Result<string>> {
  await resetDemoOrg({ db, org });
  const { organizationId, members } = await bootstrapDemoOrg({ db, org });
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "system", userId: null },
    db,
  });
  const roles = await seedDemoRoles({ context, org, members });
  if (!roles.ok) return roles;
  const failures = await checkDemoOrg({ context, org });
  if (failures.length > 0) {
    const message = `Demo checks failed:\n${failures.join("\n")}`;
    return err({ error: new AppError({ code: "INTERNAL", message }) });
  }
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
