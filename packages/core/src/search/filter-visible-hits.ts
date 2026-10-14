import type { EmbeddingHit, ScopedDbClient } from "@okazi/db";
import type { Embeddable, SearchViewer } from "./embeddable";

export type FilterVisibleHitsInput = {
  hits: readonly EmbeddingHit[];
  embeddables: readonly Embeddable[];
  db: ScopedDbClient;
  viewer: SearchViewer;
};

/** Keeps hits whose entity is registered, still active and visible to `viewer`. */
export async function filterVisibleHits({
  hits,
  embeddables,
  db,
  viewer,
}: FilterVisibleHitsInput): Promise<EmbeddingHit[]> {
  const idsByType = new Map<string, string[]>();
  for (const hit of hits) {
    idsByType.set(hit.entityType, [...(idsByType.get(hit.entityType) ?? []), hit.entityId]);
  }
  const visible = new Set<string>();
  for (const [entityType, ids] of idsByType) {
    const embeddable = embeddables.find((candidate) => candidate.entityType === entityType);
    if (!embeddable) continue;
    for (const row of await embeddable.load({ ids, db, viewer })) {
      visible.add(`${entityType}:${row.id}`);
    }
  }
  return hits.filter((hit) => visible.has(`${hit.entityType}:${hit.entityId}`));
}
