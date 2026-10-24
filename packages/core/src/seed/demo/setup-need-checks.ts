import { getOrganizationProfile } from "../../features/organization-profile/operations";
import { listTicketStatuses } from "../../features/ticket-status/read-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckSetupNeedInput = { context: ExecuteContext; org: DemoOrg; skipPipeline: boolean };

/**
 * The welcome setup (ADR 0061) is for an organization whose setup is PENDING and that has no
 * statuses. With `--skip-pipeline` the organization must need it, with no grid cells and only each
 * item type's default state; otherwise it must be COMPLETED with statuses.
 */
export async function checkDemoSetupNeed({
  context,
  org,
  skipPipeline,
}: CheckSetupNeedInput): Promise<string[]> {
  const profile = await execute({ operation: getOrganizationProfile, input: {}, context });
  if (!profile.ok) return [`${org.slug}: could not read the organization profile`];
  const expected = skipPipeline ? "PENDING" : "COMPLETED";
  if (profile.value.setupStatus !== expected) {
    return [`${org.slug}: setup is ${profile.value.setupStatus}, expected ${expected}`];
  }
  const statuses = await execute({ operation: listTicketStatuses, input: { limit: 1 }, context });
  if (!statuses.ok) return [`${org.slug}: could not read statuses`];
  const needsSetup = statuses.value.items.length === 0;
  if (needsSetup !== skipPipeline) {
    return [`${org.slug}: ${needsSetup ? "needs" : "does not need"} the guided pipeline setup`];
  }
  if (!skipPipeline) return [];
  const cells = await context.db.statusStateRule.count();
  const types = await context.db.entityType.count({ where: { base: "ITEM" } });
  const states = await context.db.itemState.count();
  const failures = cells > 0 ? [`${org.slug}: ${cells} grid cells, expected none`] : [];
  if (states !== types) failures.push(`${org.slug}: ${states} item states, expected ${types}`);
  return failures;
}
