import type { ScopedDbClient } from "@okazi/db";
import type { Permission } from "../operations/permission";

export type ToTextInput<E> = { entity: E };

/** The user a search runs for; per-user visibility (private conversations, personal skills). */
export type SearchViewer = { userId: string | null };

export type LoadInput = {
  ids: readonly string[];
  db: ScopedDbClient;
  /**
   * Set by `search`: return only entities this user may see. Omitted by the indexer, which
   * loads every indexable row of the org.
   */
  viewer?: SearchViewer;
};

/**
 * Opt-in contract for searchable entities. Method syntax keeps implementations for
 * concrete entity types assignable to `Embeddable`. Register new ones in `search/embeddables.ts`.
 */
export interface Embeddable<E extends { id: string } = { id: string }> {
  /** Stored in `Embedding.entityType`; matches the operation/entity prefix, e.g. `venue`. */
  readonly entityType: string;
  /** When set, `search` drops hits of this type for callers without the permission. */
  readonly readPermission?: Permission;
  /** Text that is embedded and full-text indexed. Keep it human-readable. */
  toText(input: ToTextInput<E>): string;
  /** Loads active entities by id through the org-scoped db (missing = not indexable/visible). */
  load(input: LoadInput): Promise<E[]>;
}
