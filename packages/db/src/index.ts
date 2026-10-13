export { type CreateDbInput, createDb, type Db } from "./client";
export { deleteEmbedding } from "./embeddings/delete-embedding";
export { searchEmbeddings } from "./embeddings/search-embeddings";
export {
  type DeleteEmbeddingInput,
  EMBEDDING_DIMENSIONS,
  type EmbeddingHit,
  type EmbeddingVector,
  type SearchEmbeddingsInput,
  type UpsertEmbeddingInput,
} from "./embeddings/types";
export { upsertEmbedding } from "./embeddings/upsert-embedding";
export {
  ActorType,
  type AuditLog,
  type Embedding,
  Prisma,
  RecordStatus,
  type Room,
  type Venue,
} from "./generated/prisma/client";
export { getDb } from "./get-db";
export { ORG_SCOPED_MODELS, SOFT_DELETE_MODELS } from "./scoped/models";
export { ScopeViolationError } from "./scoped/scope-violation";
export {
  type ScopedDb,
  type ScopedDbClient,
  type ScopedDbInput,
  scopedDb,
} from "./scoped/scoped-db";
