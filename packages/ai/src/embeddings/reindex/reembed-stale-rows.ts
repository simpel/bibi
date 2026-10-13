import type { EmbedFn } from "@okazi/core";
import { type Db, GLOBAL_EMBEDDING_SCOPE, upsertEmbedding } from "@okazi/db";

export type ReembedStaleRowsInput = {
  db: Db;
  embed: EmbedFn;
  /** Model id the embedder writes; rows with another `model` are stale. */
  model: string;
  /** Only this org (plus the global SYSTEM-skill rows); default every org. */
  organizationId?: string;
  batchSize: number;
};

const staleWhere = ({ model, organizationId }: Pick<ReembedStaleRowsInput, "model" | "organizationId">) => ({
  model: { not: model },
  ...(organizationId ? { organizationId: { in: [organizationId, GLOBAL_EMBEDDING_SCOPE] } } : {}),
});

/**
 * Re-embeds index rows written by another embedding model from their stored `content` (the text
 * is unchanged, only the vector and `model` are replaced). Pages by id, so it always terminates.
 */
export async function reembedStaleRows({
  db,
  embed,
  model,
  organizationId,
  batchSize,
}: ReembedStaleRowsInput): Promise<number> {
  let cursor: string | undefined;
  let count = 0;
  for (;;) {
    const rows = await db.embedding.findMany({
      where: { ...staleWhere({ model, organizationId }), ...(cursor ? { id: { gt: cursor } } : {}) },
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
