export const EMBEDDING_DIMENSIONS = 1536;

/**
 * `Embedding.organizationId` of index rows for global entities (SYSTEM skills). Every org's
 * search includes these rows. Never a real org id: `scopedDb` refuses it.
 */
export const GLOBAL_EMBEDDING_SCOPE = "__global__";

export type EmbeddingVector = readonly number[];

/**
 * Which entity an index row is for. Records (ADR 0056) are stored in `recordId` with a foreign
 * key; other entities (venue, skill, conversation) in `entityId`. `entityId` is the id either way.
 */
export type EmbeddingKey = {
  entityType: string;
  entityId: string;
  isRecord: boolean;
};

export type UpsertEmbeddingInput = EmbeddingKey & {
  organizationId: string;
  model: string;
  content: string;
  contentHash: string;
  embedding: EmbeddingVector;
};

export type SearchEmbeddingsInput = {
  organizationId: string;
  text: string;
  embedding: EmbeddingVector;
  entityTypes?: readonly string[];
  limit?: number;
};

export type EmbeddingHit = {
  entityType: string;
  entityId: string;
  score: number;
  content: string;
};

export type DeleteEmbeddingInput = EmbeddingKey & { organizationId: string };
