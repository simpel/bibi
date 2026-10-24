import { createExecuteContext, type ExecuteContext, grantAll, type Result } from "@bibi/core";
import type { Db } from "@bibi/db";
import { getLogger } from "@bibi/logger";

export type OrganizationRun = (input: { context: ExecuteContext }) => Promise<Result<unknown>>;

export type ForEachOrganizationInput = {
  db: Db;
  run: OrganizationRun;
  /** Only these organizations; left out = every one (production). */
  organizationIds?: readonly string[] | undefined;
};

export type ForEachOrganizationOutput = { succeeded: number; failed: number };

/** A SYSTEM context scoped to one organization (ADR 0004, 0027). */
function systemContext({ db, organizationId }: { db: Db; organizationId: string }) {
  return createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    db,
  });
}

/**
 * Runs `run` once per organization with an org-scoped SYSTEM context. One organization's failure
 * (error result or throw) is logged with its `organizationId` and does not stop the others.
 */
export async function forEachOrganization({
  db,
  run,
  organizationIds,
}: ForEachOrganizationInput): Promise<ForEachOrganizationOutput> {
  const organizations = await db.organization.findMany({
    ...(organizationIds ? { where: { id: { in: [...organizationIds] } } } : {}),
    select: { id: true },
    orderBy: { id: "asc" },
  });
  const output = { succeeded: 0, failed: 0 };
  for (const { id: organizationId } of organizations) {
    try {
      const result = await run({ context: systemContext({ db, organizationId }) });
      if (result.ok) {
        output.succeeded++;
        continue;
      }
      output.failed++;
      getLogger().error({ event: "job.organizationFailed", organizationId, err: result.error });
    } catch (error) {
      output.failed++;
      getLogger().error({ event: "job.organizationFailed", organizationId, err: error });
    }
  }
  return output;
}
