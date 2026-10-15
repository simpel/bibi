import type { Db } from "../client";
import type { Prisma } from "../generated/prisma/client";
import { redactAuditImage } from "./redact-audit-image";

export type PseudonymiseAuditLogInput = {
  db: Db;
  /** Rows created before this instant are pseudonymised. */
  createdBefore: Date;
  /** Rows per transaction; the job loops until none are left. */
  batchSize?: number;
};

export type PseudonymiseAuditLogOutput = { pseudonymised: number };

type Row = { id: string; entityType: string | null; before: unknown; after: unknown };

function redacted({ value, entityType }: { value: unknown; entityType: string | null }) {
  if (value === null) return undefined;
  return redactAuditImage({ value, entityType }) as Prisma.InputJsonValue;
}

async function redactBatch({ db, rows, at }: { db: Db; rows: Row[]; at: Date }): Promise<void> {
  await db.$transaction(
    rows.map(({ id, entityType, before, after }) =>
      db.auditLog.update({
        where: { id },
        data: {
          before: redacted({ value: before, entityType }),
          after: redacted({ value: after, entityType }),
          pseudonymisedAt: at,
        },
      }),
    ),
  );
}

/**
 * Redacts personal values in `AuditLog.before`/`after` of rows older than `createdBefore`, across
 * all organizations (ADR 0032). Dedicated system code: AuditLog is append-only through
 * `scopedDb`, so this is the only writer that changes a row. Only the images change; actor,
 * entity, operation, timestamps, `requestId` and `surface` stay. Idempotent: rows already
 * pseudonymised (`pseudonymisedAt` set) are skipped. Rows are kept (ADR 0032: 7 years).
 */
export async function pseudonymiseAuditLog({
  db,
  createdBefore,
  batchSize = 500,
}: PseudonymiseAuditLogInput): Promise<PseudonymiseAuditLogOutput> {
  const at = new Date();
  let pseudonymised = 0;
  for (;;) {
    const rows = await db.auditLog.findMany({
      where: { pseudonymisedAt: null, createdAt: { lt: createdBefore } },
      select: { id: true, entityType: true, before: true, after: true },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    });
    if (rows.length === 0) return { pseudonymised };
    await redactBatch({ db, rows, at });
    pseudonymised += rows.length;
  }
}
