import { AppError } from "../errors/app-error";
import { err, ok } from "../errors/result";
import { defineOperation } from "../operations/define-operation";
import type { EmbedFn } from "./embed";
import { SearchInputSchema, SearchOutputSchema } from "./search-schema";

export type CreateSearchOperationInput = { embed: EmbedFn };

/** Hybrid (full-text + semantic) search across all embeddable entities of the org. */
export function createSearchOperation({ embed }: CreateSearchOperationInput) {
  return defineOperation({
    name: "search",
    kind: "query",
    description:
      "Search venues, rooms and other entities of the current organization by meaning " +
      "and keywords. Returns entity type, id, score and the indexed text.",
    input: SearchInputSchema,
    output: SearchOutputSchema,
    permission: "search:read",
    handler: async ({ input, context }) => {
      const { embeddings } = await embed({ texts: [input.query] });
      const [embedding] = embeddings;
      if (!embedding) {
        return err({ error: new AppError({ code: "INTERNAL", message: "Embedding failed" }) });
      }
      const hits = await context.db.$searchEmbeddings({
        text: input.query,
        embedding,
        limit: input.limit,
        ...(input.entityTypes ? { entityTypes: input.entityTypes } : {}),
      });
      return ok({ value: { hits } });
    },
  });
}
