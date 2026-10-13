import "server-only";
import type { EmbedFn } from "@okazi/core";
import { hashEmbedding, PLACEHOLDER_EMBEDDING_MODEL } from "@/lib/placeholder-embedding";

/**
 * PLACEHOLDER (AI phase replaces this): the embedder injected into core's `search` operation
 * and indexing hook. It is deterministic and offline. When `AI_GATEWAY_API_KEY` is set, the AI
 * phase swaps this for an AI SDK `embedMany` call using `AI_EMBEDDING_MODEL`; until then both
 * cases use the hash embedder and rows are tagged with the placeholder model id, so a later
 * re-embed can find and replace them.
 */
export const embed: EmbedFn = async ({ texts }) => ({
  model: PLACEHOLDER_EMBEDDING_MODEL,
  embeddings: texts.map((text) => hashEmbedding({ text })),
});
