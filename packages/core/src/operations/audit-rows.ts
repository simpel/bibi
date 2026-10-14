import { getLogContext } from "@okazi/logger";
import { toJson } from "../shared/to-json";
import type { Actor, RecordedChange } from "./types";

const ACTOR_TYPE = { user: "USER", ai: "AI", system: "SYSTEM" } as const;

export type AuditRowsInput = {
  /** `""` for org commands (forced by scopedDb), `PLATFORM_SCOPE` for platform commands. */
  organizationId: string;
  operation: { name: string; entityType: string };
  actor: Actor;
  changes: readonly RecordedChange[];
  output: unknown;
};

/**
 * AuditLog rows for one command, shared by org and platform commands: one row per recorded
 * change, or one row with the output when nothing was recorded.
 */
export function auditRows({ organizationId, operation, actor, changes, output }: AuditRowsInput) {
  const outputId = (output as { id?: unknown } | null)?.id;
  // Ties the audit rows to the system log of the same request (ADR 0014).
  const { requestId = null, surface = "system" } = getLogContext() ?? {};
  const rows: RecordedChange[] =
    changes.length > 0 ? [...changes] : [{ entityId: String(outputId ?? ""), after: output }];
  return rows.map((change) => ({
    organizationId,
    actorType: ACTOR_TYPE[actor.type],
    actorId: actor.userId,
    conversationId: actor.conversationId ?? null,
    approvedBy: actor.approvedBy ?? null,
    operation: operation.name,
    entityType: change.entityType ?? operation.entityType,
    entityId: change.entityId || null,
    before: toJson({ value: change.before }),
    after: toJson({ value: change.after }),
    requestId,
    surface,
  }));
}
