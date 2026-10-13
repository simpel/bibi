/**
 * PLACEHOLDER EMBEDDING (not a real model). Deterministic feature hashing of words into a
 * 1536-dimension unit vector so search works offline and in tests. Real embeddings via the
 * AI SDK / AI Gateway replace this in the AI phase (see `server/embed.ts`).
 */
export const PLACEHOLDER_EMBEDDING_MODEL = "okazi-placeholder-hash-v1";
export const EMBEDDING_DIMENSIONS = 1536;

export type HashEmbeddingInput = { text: string };

const WORD = /[\p{L}\p{N}]+/gu;

// FNV-1a, 32 bit.
const hashWord = ({ word }: { word: string }): number => {
  let hash = 0x811c9dc5;
  for (const char of word) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

/** Same text always yields the same vector; shared words yield similar vectors. */
export function hashEmbedding({ text }: HashEmbeddingInput): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  for (const match of text.toLowerCase().matchAll(WORD)) {
    const hash = hashWord({ word: match[0] });
    const index = hash % EMBEDDING_DIMENSIONS;
    vector[index] = (vector[index] ?? 0) + (hash & 0x80000000 ? -1 : 1);
  }
  const norm = Math.hypot(...vector);
  if (norm === 0) {
    vector[0] = 1;
    return vector;
  }
  return vector.map((value) => value / norm);
}
