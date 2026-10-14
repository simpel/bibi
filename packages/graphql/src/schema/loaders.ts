import type { EntityTypeDto, VocabularyDto } from "@okazi/core";
import type { ScopedDb } from "@okazi/db";
import { type BatchLoader, createBatchLoader } from "./batch-loader";

type VenueRow = NonNullable<Awaited<ReturnType<ScopedDb["venue"]["findFirst"]>>>;
type SetupRow = NonNullable<Awaited<ReturnType<ScopedDb["setup"]["findFirst"]>>>;

/** Graph-edge loaders. Permission is checked by the resolver; reads go through the org-scoped db. */
export type Loaders = {
  venue: BatchLoader<VenueRow>;
  setup: BatchLoader<SetupRow>;
  entityType: BatchLoader<EntityTypeDto>;
  vocabulary: BatchLoader<VocabularyDto>;
};

const byId = <T extends { id: string }>({ rows }: { rows: readonly T[] }): Map<string, T> =>
  new Map(rows.map((row) => [row.id, row]));

type DbInput = { db: ScopedDb };
type Ids = { ids: readonly string[] };

async function loadEntityTypes({ db, ids }: DbInput & Ids) {
  const rows = await db.entityType.findMany({ where: { id: { in: [...ids] } } });
  const fields = await db.fieldDefinition.findMany({
    where: { entityTypeId: { in: rows.map((row) => row.id) } },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
  const dtos = rows.map((row) => ({
    ...row,
    fields: fields.filter((field) => field.entityTypeId === row.id),
  }));
  return byId({ rows: dtos });
}

async function loadVocabularies({ db, ids }: DbInput & Ids) {
  const rows = await db.vocabulary.findMany({ where: { id: { in: [...ids] } } });
  const values = await db.vocabularyValue.findMany({
    where: { vocabularyId: { in: rows.map((row) => row.id) } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, vocabularyId: true, name: true, position: true },
  });
  const dtos = rows.map((row) => ({
    ...row,
    values: values.filter((value) => value.vocabularyId === row.id),
  }));
  return byId({ rows: dtos });
}

/** One set per request. Entities with per-user visibility are not here: they use operations. */
export function createLoaders({ db }: DbInput): Loaders {
  return {
    venue: createBatchLoader({
      batch: async (ids) =>
        byId({ rows: await db.venue.findMany({ where: { id: { in: [...ids] } } }) }),
    }),
    setup: createBatchLoader({
      batch: async (ids) =>
        byId({ rows: await db.setup.findMany({ where: { id: { in: [...ids] } } }) }),
    }),
    entityType: createBatchLoader({ batch: (ids) => loadEntityTypes({ db, ids }) }),
    vocabulary: createBatchLoader({ batch: (ids) => loadVocabularies({ db, ids }) }),
  };
}
