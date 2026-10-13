import type { ScopedDbClient } from "@okazi/db";

export type ToTextInput<E> = { entity: E };
export type LoadInput = { ids: readonly string[]; db: ScopedDbClient };

/**
 * Opt-in contract for searchable entities. Method syntax keeps implementations for
 * concrete entity types assignable to `Embeddable`.
 */
export interface Embeddable<E extends { id: string } = { id: string }> {
  /** Stored in `Embedding.entityType`; matches the operation/entity prefix, e.g. `venue`. */
  readonly entityType: string;
  /** Text that is embedded and full-text indexed. Keep it human-readable. */
  toText(input: ToTextInput<E>): string;
  /** Loads active entities by id through the org-scoped db (missing = not indexable). */
  load(input: LoadInput): Promise<E[]>;
}
