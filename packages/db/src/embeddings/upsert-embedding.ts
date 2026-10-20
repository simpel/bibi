import { createId } from "@paralleldrive/cuid2";
import type { Db } from "../client";
import { Prisma } from "../generated/prisma/client";
import type { UpsertEmbeddingInput } from "./types";
import { toVectorLiteral } from "./vector-literal";

export type UpsertEmbeddingArgs = UpsertEmbeddingInput & { db: Db };

/**
 * Inserts or refreshes the index row for one entity. Returns true when a row changed. A record's
 * row is keyed by `recordId` (ADR 0056), any other entity's by `entityType` + `entityId`.
 */
export async function upsertEmbedding({ db, ...row }: UpsertEmbeddingArgs): Promise<boolean> {
  const vector = toVectorLiteral({ embedding: row.embedding });
  const recordId = row.isRecord ? row.entityId : null;
  const entityId = row.isRecord ? null : row.entityId;
  const conflict = row.isRecord
    ? Prisma.sql`("organizationId", "recordId")`
    : Prisma.sql`("organizationId", "entityType", "entityId")`;
  const changed = await db.$executeRaw`
    INSERT INTO "Embedding"
      ("id", "organizationId", "entityType", "entityId", "recordId", "model", "content",
       "contentHash", "embedding", "updatedAt")
    VALUES
      (${createId()}, ${row.organizationId}, ${row.entityType}, ${entityId}, ${recordId},
       ${row.model}, ${row.content}, ${row.contentHash}, ${vector}::vector, now())
    ON CONFLICT ${conflict} DO UPDATE SET
      "model" = EXCLUDED."model",
      "content" = EXCLUDED."content",
      "contentHash" = EXCLUDED."contentHash",
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = now()
    WHERE "Embedding"."contentHash" <> EXCLUDED."contentHash"
       OR "Embedding"."model" <> EXCLUDED."model"`;
  return changed > 0;
}
