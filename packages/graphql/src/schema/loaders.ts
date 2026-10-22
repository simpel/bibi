import {
  CUSTOMER_INCLUDE,
  type CustomerDto,
  type EntityTypeDto,
  type ItemStateDto,
  type PermissionSet,
  type TicketPhaseDto,
  toCustomerDto,
  toItemStateDto,
  toTicketPhaseDto,
  type VocabularyDto,
  type VocabularyValueDto,
  WITH_STATE_TRANSITIONS,
  WITH_TRANSITIONS,
} from "@bibi/core";
import type { ScopedDb } from "@bibi/db";
import { type BatchLoader, createBatchLoader } from "./batch-loader";

type VenueRow = NonNullable<Awaited<ReturnType<ScopedDb["venue"]["findFirst"]>>>;
type SetupRow = NonNullable<Awaited<ReturnType<ScopedDb["setup"]["findFirst"]>>>;

/** Graph-edge loaders. Permission is checked by the resolver; reads go through the org-scoped db. */
export type Loaders = {
  venue: BatchLoader<VenueRow>;
  setup: BatchLoader<SetupRow>;
  customer: BatchLoader<CustomerDto>;
  ticketPhase: BatchLoader<TicketPhaseDto>;
  itemState: BatchLoader<ItemStateDto>;
  entityType: BatchLoader<EntityTypeDto>;
  vocabulary: BatchLoader<VocabularyDto>;
  vocabularyValue: BatchLoader<VocabularyValueDto>;
};

const byId = <T extends { id: string }>({ rows }: { rows: readonly T[] }): Map<string, T> =>
  new Map(rows.map((row) => [row.id, row]));

type DbInput = { db: ScopedDb };

/** The caller's permissions: DTOs fill caller-dependent fields from them (ADR 0050). */
export type CreateLoadersInput = DbInput & { permissions: PermissionSet };
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

/** Statuses by id, archived ones included: a ticket keeps a status that has been archived. */
async function loadTicketPhases({ db, ids }: DbInput & Ids) {
  const rows = await db.ticketPhase.findMany({
    where: { id: { in: [...ids] }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    include: WITH_TRANSITIONS,
  });
  return byId({ rows: rows.map((row) => toTicketPhaseDto({ row })) });
}

/** States by id, archived ones included: an archived line keeps the state it had. */
async function loadItemStates({ db, ids }: DbInput & Ids) {
  const rows = await db.itemState.findMany({
    where: { id: { in: [...ids] }, status: { in: ["ACTIVE", "ARCHIVED"] } },
    include: WITH_STATE_TRANSITIONS,
  });
  return byId({ rows: rows.map((row) => toItemStateDto({ row })) });
}

/** One set per request. Entities with per-user visibility are not here: they use operations. */
export function createLoaders({ db, permissions }: CreateLoadersInput): Loaders {
  return {
    venue: createBatchLoader({
      batch: async (ids) =>
        byId({ rows: await db.venue.findMany({ where: { id: { in: [...ids] } } }) }),
    }),
    setup: createBatchLoader({
      batch: async (ids) =>
        byId({ rows: await db.setup.findMany({ where: { id: { in: [...ids] } } }) }),
    }),
    customer: createBatchLoader({
      batch: async (ids) => {
        const where = { id: { in: [...ids] } };
        const rows = await db.customer.findMany({ where, include: CUSTOMER_INCLUDE });
        return byId({ rows: rows.map((row) => toCustomerDto({ row, context: { permissions } })) });
      },
    }),
    ticketPhase: createBatchLoader({ batch: (ids) => loadTicketPhases({ db, ids }) }),
    itemState: createBatchLoader({ batch: (ids) => loadItemStates({ db, ids }) }),
    entityType: createBatchLoader({ batch: (ids) => loadEntityTypes({ db, ids }) }),
    vocabulary: createBatchLoader({ batch: (ids) => loadVocabularies({ db, ids }) }),
    vocabularyValue: createBatchLoader({
      batch: async (ids) => {
        const select = { id: true, vocabularyId: true, name: true, position: true };
        return byId({
          rows: await db.vocabularyValue.findMany({ where: { id: { in: [...ids] } }, select }),
        });
      },
    }),
  };
}
