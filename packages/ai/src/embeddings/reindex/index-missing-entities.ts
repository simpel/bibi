import { type EmbedFn, indexEntity, SEARCHABLE_ENTITIES } from "@okazi/core";
import { type Db, type ScopedDbClient, scopedDb } from "@okazi/db";

type IdRow = { id: string };
type ListIds = (input: { db: ScopedDbClient }) => Promise<IdRow[]>;

/**
 * Active ids per searchable entity type (scopedDb hides archived rows). SYSTEM skills are indexed
 * globally by the seeder, so only org/personal skills are listed here.
 */
const ID_LISTERS: Readonly<Record<string, ListIds>> = {
  venue: ({ db }) => db.venue.findMany({ select: { id: true } }),
  room: ({ db }) => db.room.findMany({ select: { id: true } }),
  conversation: ({ db }) => db.conversation.findMany({ select: { id: true } }),
  skill: ({ db }) =>
    db.skill.findMany({ where: { scope: { not: "SYSTEM" } }, select: { id: true } }),
};

export type IndexMissingEntitiesInput = { db: Db; embed: EmbedFn; organizationId: string };

/** Indexes searchable entities of one org that have no index row yet (e.g. after an outage). */
export async function indexMissingEntities({
  db,
  embed,
  organizationId,
}: IndexMissingEntitiesInput): Promise<number> {
  const scoped = scopedDb({ organizationId, db });
  let count = 0;
  for (const embeddable of SEARCHABLE_ENTITIES) {
    const listIds = ID_LISTERS[embeddable.entityType];
    if (!listIds) continue;
    const ids = (await listIds({ db: scoped })).map((row) => row.id);
    const indexed = await scoped.embedding.findMany({
      where: { entityType: embeddable.entityType, entityId: { in: ids } },
      select: { entityId: true },
    });
    const present = new Set(indexed.map((row) => row.entityId));
    for (const entityId of ids.filter((id) => !present.has(id))) {
      const outcome = await indexEntity({ embeddable, entityId, db: scoped, embed });
      if (outcome === "indexed") count++;
    }
  }
  return count;
}
