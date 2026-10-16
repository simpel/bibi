import type { Db } from "../client";
import { deleteEmbedding } from "../embeddings/delete-embedding";
import { searchEmbeddings } from "../embeddings/search-embeddings";
import {
  type DeleteEmbeddingInput,
  GLOBAL_EMBEDDING_SCOPE,
  type SearchEmbeddingsInput,
  type UpsertEmbeddingInput,
} from "../embeddings/types";
import { upsertEmbedding } from "../embeddings/upsert-embedding";
import { getDb } from "../get-db";
import { applyScope } from "./apply-scope";
import { PLATFORM_SCOPE } from "./platform-scope";
import { ScopeViolationError } from "./scope-violation";

export type ScopedDbInput = {
  organizationId: string;
  /**
   * Who writes: the user id, or `SYSTEM_ACTOR_ID` for system work. Forced into `createdBy` on
   * every create (ADR 0006); required so no row is created without an author.
   */
  actorId: string;
  /** Base client; defaults to the process singleton. */
  db?: Db;
};

type Scoped<T> = Omit<T, "organizationId">;

function extend({ organizationId, actorId, db }: Required<ScopedDbInput>) {
  return db.$extends({
    name: "okazi-org-scope",
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          return query(
            applyScope({ model, operation, args, organizationId, actorId }) as typeof args,
          );
        },
      },
    },
    client: {
      $upsertEmbedding: (row: Scoped<UpsertEmbeddingInput>) =>
        upsertEmbedding({ ...row, db, organizationId }),
      $searchEmbeddings: (input: Scoped<SearchEmbeddingsInput>) =>
        searchEmbeddings({ ...input, db, organizationId }),
      $deleteEmbedding: (input: Scoped<DeleteEmbeddingInput>) =>
        deleteEmbedding({ ...input, db, organizationId }),
    },
  });
}

type Extended = ReturnType<typeof extend>;

/** Raw SQL and lifecycle methods are hidden: they would bypass organization scoping. */
type HiddenMethods =
  | "$queryRaw"
  | "$executeRaw"
  | "$queryRawUnsafe"
  | "$executeRawUnsafe"
  | "$extends"
  | "$connect"
  | "$disconnect"
  | "$on";

export type ScopedDb = Omit<Extended, HiddenMethods>;

/** Client usable inside `ScopedDb.$transaction(async (tx) => …)` as well as outside it. */
export type ScopedDbClient = Omit<ScopedDb, "$transaction">;

/**
 * Prisma client pinned to one organization: every read/write gets `organizationId` forced,
 * soft-deleted rows are hidden unless `status` is filtered explicitly, and models without
 * `organizationId` are rejected. Global-read models (Skill) also return global rows on reads.
 * Creates get `createdBy = actorId` on models with that column; updates cannot change it.
 * Nested relation writes are rejected (only `connect`/`disconnect`/`set` may be nested).
 */
export function scopedDb({ organizationId, actorId, db }: ScopedDbInput): ScopedDb {
  const reserved = organizationId === GLOBAL_EMBEDDING_SCOPE || organizationId === PLATFORM_SCOPE;
  if (organizationId.trim() === "" || reserved) {
    const reason = "empty or reserved organization id";
    throw new ScopeViolationError({ model: undefined, operation: "scopedDb", reason });
  }
  if (actorId.trim() === "") {
    const reason = "empty actor id";
    throw new ScopeViolationError({ model: undefined, operation: "scopedDb", reason });
  }
  return extend({ organizationId, actorId, db: db ?? getDb() });
}
