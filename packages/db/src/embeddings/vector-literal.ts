import { EMBEDDING_DIMENSIONS, type EmbeddingVector } from "./types";

export type ToVectorLiteralInput = { embedding: EmbeddingVector };

/** Serialises a vector to pgvector's text form (`[1,2,3]`) after validating it. */
export function toVectorLiteral({ embedding }: ToVectorLiteralInput): string {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new RangeError(`Embedding must have ${EMBEDDING_DIMENSIONS} dimensions`);
  }
  if (!embedding.every((value) => Number.isFinite(value))) {
    throw new RangeError("Embedding contains non-finite values");
  }
  return `[${embedding.join(",")}]`;
}
