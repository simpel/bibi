import { EMBEDDING_DIMENSIONS } from "@okazi/db";

/**
 * Model id of the deterministic placeholder embedder. Same id (and algorithm) as the web app's
 * former placeholder, so rows written by either are recognised and re-embedded by `reindexAll`.
 */
export const PLACEHOLDER_EMBEDDING_MODEL = "okazi-placeholder-hash-v1";

const WORD = /[\p{L}\p{N}]+/gu;

type HashWordInput = { word: string };

// FNV-1a, 32 bit.
const hashWord = ({ word }: HashWordInput): number => {
  let hash = 0x811c9dc5;
  for (const char of word) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

export type HashEmbeddingInput = { text: string };

/**
 * PLACEHOLDER, not a real model: feature hashing of words into a unit vector. Same text gives the
 * same vector and shared words give similar vectors, so search works offline (dev and tests).
 */
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
