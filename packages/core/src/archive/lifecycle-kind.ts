import type { Result } from "../errors/result";
import type { OperationContext } from "../operations/types";
import type { Feature } from "../permissions/features";

export type KindInput = { context: OperationContext; id: string };

/** A record as restore and delete find it, archived or not. */
export type LifecycleRow = {
  archived: boolean;
  /** The raw row: the before image of the audit row (ADR 0118). */
  row: unknown;
};

/**
 * Why a restore or a delete is refused: another record still refers to it, or a record it needs
 * is archived. `feature` owns those records: without its `read` the message stays neutral.
 */
export type Blocker = { feature: Feature; path: string; message: string };

/**
 * One kind of record that has its own page and is archived, restored and deleted (ADR 0118).
 * The engine (`restore-archived.ts`, `delete-archived.ts`) runs the shared steps; a kind says only
 * how its rows are found, what refuses them and which of its own rows go with it.
 */
export type LifecycleKind = {
  /** The audit row's entity type, e.g. `task`. */
  entityType: string;
  /** The noun in messages, e.g. `Task`. */
  label: string;
  /** Extends the `Record` supertable (ADR 0056): its `Record` row follows it. */
  record: boolean;
  /** The search index key of an entity that is not a record (venue, skill). */
  indexedAs?: string;
  /** The record in either state, or null when missing (or not the caller's). */
  find: (input: KindInput) => Promise<LifecycleRow | null>;
  /** A per-record access rule beyond the permission (skills: owner or admin). */
  check?: (input: KindInput & { row: unknown }) => Result<true>;
  /** Records it needs that are archived: restore them first. */
  restoreBlockers?: (input: KindInput) => Promise<Blocker[]>;
  /** Sets it ACTIVE and clears `archivedAt` (not its `Record` row: the engine does). */
  reactivate: (input: KindInput) => Promise<void>;
  /** Brings back what was archived with it (an order's lines). */
  afterRestore?: (input: KindInput) => Promise<Result<true>>;
  /** Other records that still refer to it. */
  deleteBlockers: (input: KindInput) => Promise<Blocker[]>;
  /** Deletes its own dependent rows and its row (not its `Record` row: the engine does). */
  remove: (input: KindInput) => Promise<void>;
  /**
   * Its archived records, oldest first: all of them for the Archive page (`archive.list`), or
   * those archived before `before` for the retention job.
   */
  archived: (input: { context: OperationContext; before?: Date }) => Promise<ArchivedRow[]>;
};

/** Either state: restore and delete must see archived rows, which reads hide by default. */
export const EITHER_STATUS: { in: ("ACTIVE" | "ARCHIVED")[] } = { in: ["ACTIVE", "ARCHIVED"] };

/** The found row, archived or not. */
export const lifecycleRow = <R extends { status: string }>({
  row,
}: {
  row: R | null;
}): LifecycleRow | null => (row ? { archived: row.status === "ARCHIVED", row } : null);

/** One archived record as the Archive page and the retention job list it (ADR 0118). */
export type ArchivedRow = { id: string; name: string; archivedAt: Date | null };

/** The columns of an archived record with a `name`. */
export const ARCHIVED_SELECT = { id: true, name: true, archivedAt: true } as const;

/** The found rows as `ArchivedRow`s, for `archived`. */
export const archivedRows = async ({ rows }: { rows: Promise<ArchivedRow[]> }) => rows;

/** Archived records, only those archived before `before` when it is given (retention job). */
export const archivedWhere = ({ before }: { before?: Date }) => ({
  status: "ARCHIVED" as const,
  ...(before ? { archivedAt: { lt: before } } : {}),
});

/** The data that brings a record back (ADR 0118). */
export const REACTIVATE = { status: "ACTIVE", archivedAt: null } as const;
