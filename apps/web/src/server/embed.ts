import "server-only";
import { createEmbed } from "@bibi/ai/embed";
import type { EmbedFn } from "@bibi/core";

let cached: EmbedFn | undefined;

/**
 * The embedder injected into core's `search` operation and indexing hook: the real AI SDK
 * embedder from `@bibi/ai/embed` (AI Gateway, model chosen in `/admin/ai-models`). Without
 * `AI_GATEWAY_API_KEY` it falls back to the deterministic dev-only placeholder (and refuses in
 * production). Created lazily so importing this file never reads the environment.
 */
export const embed: EmbedFn = ({ texts }) => {
  cached ??= createEmbed();
  return cached({ texts });
};
