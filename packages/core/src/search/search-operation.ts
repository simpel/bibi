import { AppError } from "../errors/app-error";
import { err, ok } from "../errors/result";
import { defineOperation } from "../operations/define-operation";
import type { EmbedFn } from "./embed";
import type { Embeddable } from "./embeddable";
import { SEARCHABLE_ENTITIES } from "./embeddables";
import { filterVisibleHits } from "./filter-visible-hits";
import { SearchInputSchema, SearchOutputSchema } from "./search-schema";

export type CreateSearchOperationInput = {
  embed: EmbedFn;
  /** Entity types search may return; defaults to `SEARCHABLE_ENTITIES`. */
  embeddables?: readonly Embeddable[];
};

/** Over-fetch so per-user filtering (private conversations, personal skills) still fills a page. */
const OVERFETCH = 3;

/** Hybrid (full-text + semantic) search across all embeddable entities of the org. */
export function createSearchOperation({
  embed,
  embeddables = SEARCHABLE_ENTITIES,
}: CreateSearchOperationInput) {
  return defineOperation({
    name: "search",
    kind: "query",
    description:
      "Search venues, items (rooms, dishes, …), skills and your conversations in the current organization by " +
      "meaning and keywords. Returns entity type, id, score and the indexed text.",
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
        limit: input.limit * OVERFETCH,
        ...(input.entityTypes ? { entityTypes: input.entityTypes } : {}),
      });
      const viewer = { userId: context.actor.userId };
      const visible = await filterVisibleHits({ hits, embeddables, db: context.db, viewer });
      return ok({ value: { hits: visible.slice(0, input.limit) } });
    },
  });
}
