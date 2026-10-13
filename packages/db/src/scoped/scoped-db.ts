import type { Db } from "../client";
import { deleteEmbedding } from "../embeddings/delete-embedding";
import { searchEmbeddings } from "../embeddings/search-embeddings";
import type {
  DeleteEmbeddingInput,
  SearchEmbeddingsInput,
  UpsertEmbeddingInput,
} from "../embeddings/types";
import { upsertEmbedding } from "../embeddings/upsert-embedding";
import { getDb } from "../get-db";
import { applyScope } from "./apply-scope";
import { ScopeViolationError } from "./scope-violation";

export type ScopedDbInput = {
  organizationId: string;
  /** Base client; defaults to the process singleton. */
  db?: Db;
};

type Scoped<T> = Omit<T, "organizationId">;

function extend({ organizationId, db }: Required<ScopedDbInput>) {
  return db.$extends({
    name: "okazi-org-scope",
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          return query(applyScope({ model, operation, args, organizationId }) as typeof args);
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
 * `organizationId` are rejected.
 */
export function scopedDb({ organizationId, db }: ScopedDbInput): ScopedDb {
  if (organizationId.trim() === "") {
    throw new ScopeViolationError({ model: undefined, operation: "scopedDb", reason: "empty id" });
  }
  return extend({ organizationId, db: db ?? getDb() });
}
