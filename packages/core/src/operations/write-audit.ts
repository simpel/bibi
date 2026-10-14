import type { ScopedDbClient } from "@okazi/db";
import { auditRows } from "./audit-rows";
import type { Actor, AnyOperation, RecordedChange } from "./types";

export type WriteAuditInput = {
  db: ScopedDbClient;
  operation: AnyOperation;
  actor: Actor;
  changes: readonly RecordedChange[];
  output: unknown;
};

/** One row per recorded change; a command recording nothing still gets one row. */
export async function writeAudit({
  db,
  operation,
  actor,
  changes,
  output,
}: WriteAuditInput): Promise<void> {
  // organizationId "" is replaced by scopedDb with the caller's organization.
  const data = auditRows({ organizationId: "", operation, actor, changes, output });
  await db.auditLog.createMany({ data });
}
