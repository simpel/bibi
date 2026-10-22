import { getLogger } from "@bibi/logger";
import type { Result } from "../errors/result";
import type { Actor, OperationKind } from "./types";

export type LogOperationInput = {
  /** Org operation or platform operation (ADR 0015). */
  operation: { name: string; kind: OperationKind; entityType: string };
  /** Platform operations have no organization (`organizationId` absent). */
  context: { organizationId?: string; actor: Actor };
  result: Result<unknown>;
  durationMs: number;
};

/**
 * Exactly one system-log line per `execute` (ADR 0014): completed, rejected (caller's fault) or
 * failed (ours). Input and output are never logged; AuditLog holds the before/after state.
 */
export function logOperation({ operation, context, result, durationMs }: LogOperationInput): void {
  const { actor } = context;
  const fields = {
    operation: operation.name,
    kind: operation.kind,
    entityType: operation.entityType,
    organizationId: context.organizationId,
    actorType: actor.type,
    actorId: actor.userId,
    conversationId: actor.conversationId,
    approvedBy: actor.approvedBy,
    durationMs,
  };
  const log = getLogger();
  if (result.ok) {
    log.info({ event: "operation.completed", ...fields, outcome: "ok" });
    return;
  }
  const { error } = result;
  // Our side (bug, missing configuration): error level, so it alerts.
  if (error.code === "INTERNAL" || error.code === "UNAVAILABLE") {
    log.error({
      event: "operation.failed",
      ...fields,
      outcome: "failed",
      errorCode: error.code,
      err: error,
    });
    return;
  }
  log.warn({
    event: "operation.rejected",
    ...fields,
    outcome: "rejected",
    errorCode: error.code,
    errorMessage: error.message,
    issuePaths: error.issues.map((issue) => issue.path),
  });
}
