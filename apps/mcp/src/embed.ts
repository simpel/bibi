import { createEmbed } from "@okazi/ai/embed";

/**
 * Embedder for `search` and re-indexing: AI SDK `embedMany` via the AI Gateway
 * (`AI_EMBEDDING_MODEL`, 1536 dimensions). Without `AI_GATEWAY_API_KEY` it is a deterministic
 * placeholder in development and fails clearly in production (see `@okazi/ai`).
 */
export const embed = createEmbed();
