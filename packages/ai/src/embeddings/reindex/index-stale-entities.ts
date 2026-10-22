import { type EmbedFn, indexEntity, SEARCHABLE_ENTITIES } from "@bibi/core";
import { type Db, type ScopedDbClient, SYSTEM_ACTOR_ID, scopedDb } from "@bibi/db";

type IdRow = { id: string };
type ListIds = (input: { db: ScopedDbClient }) => Promise<IdRow[]>;

/**
 * Active ids per searchable entity type (scopedDb hides archived rows). SYSTEM skills are indexed
 * globally by the seeder, so only org/personal skills are listed here.
 */
const ID_LISTERS: Readonly<Record<string, ListIds>> = {
  venue: ({ db }) => db.venue.findMany({ select: { id: true } }),
  item: ({ db }) => db.item.findMany({ select: { id: true } }),
  conversation: ({ db }) => db.conversation.findMany({ select: { id: true } }),
  skill: ({ db }) =>
    db.skill.findMany({ where: { scope: { not: "SYSTEM" } }, select: { id: true } }),
};

export type IndexStaleEntitiesInput = { db: Db; embed: EmbedFn; organizationId: string };

/**
 * Indexes searchable entities of one org whose index row is missing or whose text changed since
 * it was embedded (e.g. the after-commit hook logged `search.index_failed`, ADR 0030).
 * `indexEntity` compares content hashes, so only out-of-date entities call the embedder.
 */
export async function indexStaleEntities({
  db,
  embed,
  organizationId,
}: IndexStaleEntitiesInput): Promise<number> {
  const scoped = scopedDb({ organizationId, actorId: SYSTEM_ACTOR_ID, db });
  let count = 0;
  for (const embeddable of SEARCHABLE_ENTITIES) {
    const listIds = ID_LISTERS[embeddable.entityType];
    if (!listIds) continue;
    for (const { id: entityId } of await listIds({ db: scoped })) {
      const outcome = await indexEntity({ embeddable, entityId, db: scoped, embed });
      if (outcome === "indexed") count++;
    }
  }
  return count;
}
