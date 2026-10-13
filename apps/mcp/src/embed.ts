import { appError, type EmbedFn } from "@okazi/core";

/**
 * Placeholder until `@okazi/ai` provides the real embedding function. Search and re-indexing
 * need it; every other tool works without. Swap this import in `http.ts`/`stdio.ts`.
 */
export const unconfiguredEmbed: EmbedFn = async () => {
  throw appError({ code: "INTERNAL", message: "Embedding provider is not configured in apps/mcp" });
};
