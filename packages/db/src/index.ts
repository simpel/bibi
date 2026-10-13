export { type CreateDbInput, createDb, type Db } from "./client";
export { deleteEmbedding } from "./embeddings/delete-embedding";
export { searchEmbeddings } from "./embeddings/search-embeddings";
export {
  type DeleteEmbeddingInput,
  EMBEDDING_DIMENSIONS,
  type EmbeddingHit,
  type EmbeddingVector,
  GLOBAL_EMBEDDING_SCOPE,
  type SearchEmbeddingsInput,
  type UpsertEmbeddingInput,
} from "./embeddings/types";
export { upsertEmbedding } from "./embeddings/upsert-embedding";
export {
  ActorType,
  type AuditLog,
  type Conversation,
  type Embedding,
  type Message,
  MessageRole,
  Prisma,
  RecordStatus,
  type Room,
  type Skill,
  SkillScope,
  SkillStatus,
  type Venue,
} from "./generated/prisma/client";
export { getDb } from "./get-db";
export {
  GLOBAL_READ_MODELS,
  ORG_SCOPED_MODELS,
  SOFT_DELETE_DEFAULTS,
  SOFT_DELETE_MODELS,
} from "./scoped/models";
export { ScopeViolationError } from "./scoped/scope-violation";
export {
  type ScopedDb,
  type ScopedDbClient,
  type ScopedDbInput,
  scopedDb,
} from "./scoped/scoped-db";
