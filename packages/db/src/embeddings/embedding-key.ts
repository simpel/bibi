import type { EmbeddingKey } from "./types";

export type EmbeddingWhereInput = EmbeddingKey;

/** The `Embedding` columns that identify one entity's index row (ADR 0056). */
export function embeddingWhere({ entityType, entityId, isRecord }: EmbeddingWhereInput) {
  return isRecord ? { entityType, recordId: entityId } : { entityType, entityId };
}

export type EmbeddingKeyOfInput = {
  row: { entityType: string; entityId: string | null; recordId: string | null };
};

/** The key of a stored index row: its record or its non-record entity. */
export function embeddingKeyOf({ row }: EmbeddingKeyOfInput): EmbeddingKey {
  const isRecord = row.recordId !== null;
  return { entityType: row.entityType, entityId: row.recordId ?? row.entityId ?? "", isRecord };
}
