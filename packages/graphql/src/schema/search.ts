import { createSearchOperation, type SearchHit, SearchHitSchema } from "@bibi/core";
import { builder, type ObjectRefOf } from "./builder";
import { fieldFromOperation } from "./from-operation";
import { objectFromSchema } from "./object-from-schema";
import { loadSearchEntity, SearchEntityRef } from "./search-entity";

// Schema-time stand-in; at runtime `ctx.operations` supplies the operation bound to the real embed.
const schemaOperation = createSearchOperation({
  embed: () => Promise.reject(new Error("embed is injected per request")),
});

const SearchHitRef = objectFromSchema<SearchHit>({
  name: "SearchHit",
  schema: SearchHitSchema,
  description: "One search match with its relevance score.",
});

builder.objectField(SearchHitRef, "entity", (t) =>
  t.field({
    type: SearchEntityRef,
    nullable: true,
    description: "The matching entity, resolved through the org-scoped client.",
    resolve: (hit, _args, ctx) =>
      loadSearchEntity({ entityType: hit.entityType, entityId: hit.entityId, ctx }),
  }),
);

type SearchResult = { hits: SearchHit[] };

const SearchResultRef: ObjectRefOf<SearchResult> = builder
  .objectRef<SearchResult>("SearchResult")
  .implement({
    fields: (t) => ({ hits: t.field({ type: [SearchHitRef], resolve: (r) => r.hits }) }),
  });

fieldFromOperation({ operation: schemaOperation, type: SearchResultRef, name: "search" });
