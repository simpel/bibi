import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { ExecuteContext } from "../../operations/context";
import { checkDemoOrg } from "./checks";
import type { DemoOrg } from "./types";

/** Parts of the demo seed (ADR 0025). Each part is seeded when the corresponding operations exist. */
export const DEMO_SEED_PARTS = [
  { part: 1, name: "Fixed roles" },
  { part: 2, name: "Configurable domain (types, fields, vocabularies, setups, capabilities)" },
  { part: 3, name: "Items and composition" },
  { part: 4, name: "Customers, price lists and sales pipeline" },
  { part: 5, name: "Tickets, custom statuses, program and requirements" },
  { part: 6, name: "Sheets with matching and blocking" },
  { part: 7, name: "Export" },
] as const;

export type PostSeedInput = {
  context: ExecuteContext;
  org: DemoOrg;
  ranParts: ReadonlySet<number>;
  skipPipeline: boolean;
};

/** Logs the skipped parts and the audit count, then runs the checks; failures are an error. */
export async function postSeedLogging({
  context,
  org,
  ranParts,
  skipPipeline,
}: PostSeedInput): Promise<Result<null>> {
  const log = getLogger();
  for (const { part, name } of DEMO_SEED_PARTS) {
    if (!ranParts.has(part)) log.info({ event: "seed.sliceSkipped", part, name });
  }
  const auditRowCount = await context.db.auditLog.count({
    where: { organizationId: context.organizationId, actorType: "SYSTEM" },
  });
  log.info({ event: "seed.auditCount", organizationId: context.organizationId, auditRowCount });
  const failures = await checkDemoOrg({ context, org, skipPipeline });
  if (failures.length > 0) {
    const message = `Demo checks failed:\n${failures.join("\n")}`;
    return err({ error: new AppError({ code: "INTERNAL", message }) });
  }
  return ok({ value: null });
}
