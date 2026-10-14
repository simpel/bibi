import type { Embeddable } from "@okazi/core"; // TODO: confirm the type name in packages/core
import type { {{Pascal}} } from "./schema";

// Searchable entity (ADR 0008). The text below is embedded for hybrid search (FTS + vector).
// TODO: adapt to the actual shape of the Embeddable interface in packages/core
// (entityType, toText({ entity }), load({ ids, db, viewer? })). `viewer` is set by search:
// return only rows the user may see. Register in packages/core/src/search/embeddables.ts.
export const {{camel}}Embeddable = {
  kind: "{{kebab}}",
  toEmbeddingText({ entity }: { entity: {{Pascal}} }): string {
    return [entity.name].join("\n"); // TODO: add relevant text fields
  },
} satisfies Embeddable<{{Pascal}}>;
