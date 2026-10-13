import type { Db } from "../client";
import { Prisma } from "../generated/prisma/client";
import type { EmbeddingHit, SearchEmbeddingsInput } from "./types";
import { toVectorLiteral } from "./vector-literal";

export type SearchEmbeddingsArgs = SearchEmbeddingsInput & { db: Db };

/** Reciprocal-rank-fusion constant; 60 is the common default from the RRF paper. */
const RRF_K = 60;
const CANDIDATES = 50;

type HitRow = { entityType: string; entityId: string; score: number; content: string };

/** Hybrid search: full-text (tsvector) and cosine similarity (pgvector) fused with RRF. */
export async function searchEmbeddings(args: SearchEmbeddingsArgs): Promise<EmbeddingHit[]> {
  const { db, organizationId, text, embedding, entityTypes, limit = 10 } = args;
  const vector = toVectorLiteral({ embedding });
  const typeFilter =
    entityTypes && entityTypes.length > 0
      ? Prisma.sql`AND "entityType" = ANY(${[...entityTypes]}::text[])`
      : Prisma.empty;
  const rows = await db.$queryRaw<HitRow[]>`
    WITH vec AS (
      SELECT "id", row_number() OVER (ORDER BY "embedding" <=> ${vector}::vector) AS rank
      FROM "Embedding"
      WHERE "organizationId" = ${organizationId} AND "embedding" IS NOT NULL ${typeFilter}
      ORDER BY "embedding" <=> ${vector}::vector
      LIMIT ${CANDIDATES}
    ),
    fts AS (
      SELECT "id", row_number() OVER (ORDER BY ts_rank_cd("search", q) DESC) AS rank
      FROM "Embedding", websearch_to_tsquery('simple', ${text}) AS q
      WHERE "organizationId" = ${organizationId} AND "search" @@ q ${typeFilter}
      ORDER BY ts_rank_cd("search", q) DESC
      LIMIT ${CANDIDATES}
    )
    SELECT e."entityType", e."entityId", e."content",
      (COALESCE(1.0 / (${RRF_K} + vec.rank), 0) + COALESCE(1.0 / (${RRF_K} + fts.rank), 0))::float8
        AS score
    FROM vec
    FULL OUTER JOIN fts ON fts."id" = vec."id"
    JOIN "Embedding" e ON e."id" = COALESCE(vec."id", fts."id")
    ORDER BY score DESC
    LIMIT ${limit}`;
  return rows.map((row) => ({ ...row, score: Number(row.score) }));
}
