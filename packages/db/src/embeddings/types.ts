export const EMBEDDING_DIMENSIONS = 1536;

export type EmbeddingVector = readonly number[];

export type UpsertEmbeddingInput = {
  organizationId: string;
  entityType: string;
  entityId: string;
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

export type DeleteEmbeddingInput = {
  organizationId: string;
  entityType: string;
  entityId: string;
};
