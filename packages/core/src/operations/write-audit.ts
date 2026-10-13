import type { Prisma, ScopedDbClient } from "@okazi/db";
import type { Actor, AnyOperation, RecordedChange } from "./types";

const ACTOR_TYPE = { user: "USER", ai: "AI", system: "SYSTEM" } as const;

export type WriteAuditInput = {
  db: ScopedDbClient;
  operation: AnyOperation;
  actor: Actor;
  changes: readonly RecordedChange[];
  output: unknown;
};

type ToJsonInput = { value: unknown };

function toJson({ value }: ToJsonInput): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** One row per recorded change; a command recording nothing still gets one row. */
export async function writeAudit({
  db,
  operation,
  actor,
  changes,
  output,
}: WriteAuditInput): Promise<void> {
  const outputId = (output as { id?: unknown } | null)?.id;
  const rows: RecordedChange[] =
    changes.length > 0 ? [...changes] : [{ entityId: String(outputId ?? ""), after: output }];
  await db.auditLog.createMany({
    data: rows.map((change) => ({
      organizationId: "", // forced by scopedDb
      actorType: ACTOR_TYPE[actor.type],
      actorId: actor.userId,
      conversationId: actor.conversationId ?? null,
      approvedBy: actor.approvedBy ?? null,
      operation: operation.name,
      entityType: change.entityType ?? operation.entityType,
      entityId: change.entityId || null,
      before: toJson({ value: change.before }),
      after: toJson({ value: change.after }),
    })),
  });
}
