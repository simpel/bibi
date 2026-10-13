import type { EmbedFn } from "@okazi/core";
import { type Db, GLOBAL_EMBEDDING_SCOPE, upsertEmbedding } from "@okazi/db";

export type ReembedStaleRowsInput = {
  db: Db;
  embed: EmbedFn;
  /** Model id the embedder writes; rows with another `model` are stale. */
  model: string;
  /** Only this org; default every org. */
  organizationId?: string;
  /** Also the global SYSTEM-skill rows (default true; tests turn it off). */
  includeGlobal?: boolean;
  batchSize: number;
};

type StaleWhereInput = Pick<ReembedStaleRowsInput, "model" | "organizationId" | "includeGlobal">;

const staleWhere = ({ model, organizationId, includeGlobal = true }: StaleWhereInput) => {
  const scopes = organizationId ? [organizationId] : [];
  if (organizationId && includeGlobal) scopes.push(GLOBAL_EMBEDDING_SCOPE);
  const orgFilter = organizationId ? { organizationId: { in: scopes } } : {};
  const globalFilter =
    !organizationId && !includeGlobal ? { organizationId: { not: GLOBAL_EMBEDDING_SCOPE } } : {};
  return { model: { not: model }, ...orgFilter, ...globalFilter };
};

/**
 * Re-embeds index rows written by another embedding model from their stored `content` (the text
 * is unchanged, only the vector and `model` are replaced). Pages by id, so it always terminates.
 */
export async function reembedStaleRows({
  db,
  embed,
  model,
  organizationId,
  includeGlobal,
  batchSize,
}: ReembedStaleRowsInput): Promise<number> {
  let cursor: string | undefined;
  let count = 0;
  for (;;) {
    const rows = await db.embedding.findMany({
      where: {
        ...staleWhere({ model, organizationId, includeGlobal }),
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: "asc" },
      take: batchSize,
    });
    if (rows.length === 0) return count;
    const { model: written, embeddings } = await embed({ texts: rows.map((row) => row.content) });
    for (const [index, row] of rows.entries()) {
      const embedding = embeddings[index];
      if (!embedding) continue;
      const { organizationId: org, entityType, entityId, content, contentHash } = row;
      const target = { organizationId: org, entityType, entityId, content, contentHash };
      if (await upsertEmbedding({ db, ...target, model: written, embedding })) count++;
    }
    cursor = rows.at(-1)?.id;
  }
}
