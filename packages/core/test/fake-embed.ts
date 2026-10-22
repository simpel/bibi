import { createHash } from "node:crypto";
import { EMBEDDING_DIMENSIONS } from "@bibi/db";
import type { EmbedFn } from "../src/index";

type VectorInput = { text: string };

/** Deterministic bag-of-words vector: shared words → higher cosine similarity. */
function toVector({ text }: VectorInput): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  for (const word of text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)) {
    const index = createHash("sha256").update(word).digest().readUInt32BE(0) % EMBEDDING_DIMENSIONS;
    vector[index] = (vector[index] ?? 0) + 1;
  }
  const norm = Math.hypot(...vector) || 1;
  return vector.map((value) => value / norm);
}

export const fakeEmbed: EmbedFn = async ({ texts }) => ({
  model: "fake-bow-1536",
  embeddings: texts.map((text) => toVector({ text })),
});
