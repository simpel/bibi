import { listTicketPhases } from "../../features/ticket-phase/read-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckSetupNeedInput = { context: ExecuteContext; org: DemoOrg; skipPipeline: boolean };

/**
 * The first setup (ADR 0045) is for an organization without phases, detected as
 * `ticketPhase.list` being empty. With `--skip-pipeline` the organization must need it,
 * with no grid cells and only each item type's default state; otherwise it must not.
 */
export async function checkDemoSetupNeed({
  context,
  org,
  skipPipeline,
}: CheckSetupNeedInput): Promise<string[]> {
  const phases = await execute({ operation: listTicketPhases, input: { limit: 1 }, context });
  if (!phases.ok) return [`${org.slug}: could not read phases`];
  const needsSetup = phases.value.items.length === 0;
  if (needsSetup !== skipPipeline) {
    return [`${org.slug}: ${needsSetup ? "needs" : "does not need"} the guided pipeline setup`];
  }
  if (!skipPipeline) return [];
  const cells = await context.db.phaseStateRule.count();
  const types = await context.db.entityType.count({ where: { base: "ITEM" } });
  const states = await context.db.itemState.count();
  const failures = cells > 0 ? [`${org.slug}: ${cells} grid cells, expected none`] : [];
  if (states !== types) failures.push(`${org.slug}: ${states} item states, expected ${types}`);
  return failures;
}
