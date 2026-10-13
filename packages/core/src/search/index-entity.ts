import type { ScopedDbClient } from "@okazi/db";
import { AppError } from "../errors/app-error";
import { contentHash } from "./content-hash";
import type { EmbedFn } from "./embed";
import type { Embeddable } from "./embeddable";

export type IndexEntityInput = {
  embeddable: Embeddable;
  entityId: string;
  db: ScopedDbClient;
  embed: EmbedFn;
};

export type IndexEntityOutcome = "indexed" | "unchanged" | "removed";

/** Syncs one entity into the search index; missing/archived entities are removed. */
export async function indexEntity({
  embeddable,
  entityId,
  db,
  embed,
}: IndexEntityInput): Promise<IndexEntityOutcome> {
  const { entityType } = embeddable;
  const [entity] = await embeddable.load({ ids: [entityId], db });
  if (!entity) {
    await db.$deleteEmbedding({ entityType, entityId });
    return "removed";
  }
  const content = embeddable.toText({ entity });
  const hash = contentHash({ text: content });
  const existing = await db.embedding.findFirst({
    where: { entityType, entityId },
    select: { contentHash: true },
  });
  if (existing?.contentHash === hash) return "unchanged";
  const { model, embeddings } = await embed({ texts: [content] });
  const [embedding] = embeddings;
  if (!embedding) throw new AppError({ code: "INTERNAL", message: "Embedder returned nothing" });
  await db.$upsertEmbedding({ entityType, entityId, model, content, contentHash: hash, embedding });
  return "indexed";
}
