import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../errors/result";
import type { ExecuteContext } from "../operations/context";
import { execute } from "../operations/execute";
import { listExpiredArchives } from "./list-expired-operation";
import { PURGE_KINDS } from "./purge-kinds";

export type PurgeExpiredOutput = { deleted: number; skipped: number; failed: number };

const OPERATIONS = new Map(PURGE_KINDS.map(({ operation }) => [operation.name, operation]));

/**
 * The retention job's work in one organization (ADR 0118), as SYSTEM: every record archived longer
 * than the retention goes through its own `<entity>.delete`, in its own transaction and audit
 * row. A record refused with CONFLICT (still in use, or money) is skipped and tried again the next
 * night; any other failure is counted and logged and does not stop the rest.
 */
export async function purgeExpiredArchives({
  context,
}: {
  context: ExecuteContext;
}): Promise<Result<PurgeExpiredOutput>> {
  const due = await execute({ operation: listExpiredArchives, input: {}, context });
  if (!due.ok) return due;
  const output: PurgeExpiredOutput = { deleted: 0, skipped: 0, failed: 0 };
  for (const { operation: name, id } of due.value.items) {
    const operation = OPERATIONS.get(name);
    if (!operation) continue;
    const result = await execute({ operation, input: { id }, context });
    if (result.ok) output.deleted++;
    else if (result.error.code === "CONFLICT") output.skipped++;
    else output.failed++;
  }
  const { organizationId } = context;
  getLogger().info({ event: "archive.purged", organizationId, ...output });
  return ok({ value: output });
}
