import "server-only";
import { createEmbed } from "@okazi/ai/embed";
import type { EmbedFn } from "@okazi/core";

let cached: EmbedFn | undefined;

/**
 * The embedder injected into core's `search` operation and indexing hook: the real AI SDK
 * embedder from `@okazi/ai/embed` (AI Gateway, `AI_EMBEDDING_MODEL`). Without
 * `AI_GATEWAY_API_KEY` it falls back to the deterministic dev-only placeholder (and refuses in
 * production). Created lazily so importing this file never reads the environment.
 */
export const embed: EmbedFn = ({ texts }) => {
  cached ??= createEmbed();
  return cached({ texts });
};
