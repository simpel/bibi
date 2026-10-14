import { createId } from "@paralleldrive/cuid2";
import type { Db } from "../client";
import type { UpsertEmbeddingInput } from "./types";
import { toVectorLiteral } from "./vector-literal";

export type UpsertEmbeddingArgs = UpsertEmbeddingInput & { db: Db };

/** Inserts or refreshes the index row for one entity. Returns true when a row changed. */
export async function upsertEmbedding({ db, ...row }: UpsertEmbeddingArgs): Promise<boolean> {
  const vector = toVectorLiteral({ embedding: row.embedding });
  const changed = await db.$executeRaw`
    INSERT INTO "Embedding"
      ("id", "organizationId", "entityType", "entityId", "model", "content", "contentHash",
       "embedding", "updatedAt")
    VALUES
      (${createId()}, ${row.organizationId}, ${row.entityType}, ${row.entityId}, ${row.model},
       ${row.content}, ${row.contentHash}, ${vector}::vector, now())
    ON CONFLICT ("organizationId", "entityType", "entityId") DO UPDATE SET
      "model" = EXCLUDED."model",
      "content" = EXCLUDED."content",
      "contentHash" = EXCLUDED."contentHash",
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = now()
    WHERE "Embedding"."contentHash" <> EXCLUDED."contentHash"
       OR "Embedding"."model" <> EXCLUDED."model"`;
  return changed > 0;
}
