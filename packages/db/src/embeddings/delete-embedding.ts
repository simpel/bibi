import type { Db } from "../client";
import { embeddingWhere } from "./embedding-key";
import type { DeleteEmbeddingInput } from "./types";

export type DeleteEmbeddingArgs = DeleteEmbeddingInput & { db: Db };

/** Removes an entity from the search index (e.g. when it is archived). */
export async function deleteEmbedding({
  db,
  organizationId,
  ...key
}: DeleteEmbeddingArgs): Promise<void> {
  await db.embedding.deleteMany({ where: { organizationId, ...embeddingWhere(key) } });
}
