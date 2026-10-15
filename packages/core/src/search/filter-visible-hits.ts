import type { EmbeddingHit, ScopedDbClient } from "@okazi/db";
import { hasPermission } from "../operations/permission";
import type { PermissionSet } from "../permissions/permission-set";
import type { Embeddable, SearchViewer } from "./embeddable";

export type FilterVisibleHitsInput = {
  hits: readonly EmbeddingHit[];
  embeddables: readonly Embeddable[];
  db: ScopedDbClient;
  viewer: SearchViewer;
  /** The caller's permissions: hits of a type whose `readPermission` they lack are dropped. */
  permissions: PermissionSet;
};

/** Keeps hits whose entity is registered, readable by the caller, active and visible to `viewer`. */
export async function filterVisibleHits({
  hits,
  embeddables,
  db,
  viewer,
  permissions,
}: FilterVisibleHitsInput): Promise<EmbeddingHit[]> {
  const idsByType = new Map<string, string[]>();
  for (const hit of hits) {
    idsByType.set(hit.entityType, [...(idsByType.get(hit.entityType) ?? []), hit.entityId]);
  }
  const visible = new Set<string>();
  for (const [entityType, ids] of idsByType) {
    const embeddable = embeddables.find((candidate) => candidate.entityType === entityType);
    if (!embeddable) continue;
    const permission = embeddable.readPermission;
    if (permission && !hasPermission({ permissions, permission })) continue;
    for (const row of await embeddable.load({ ids, db, viewer })) {
      visible.add(`${entityType}:${row.id}`);
    }
  }
  return hits.filter((hit) => visible.has(`${hit.entityType}:${hit.entityId}`));
}
