import type { Embeddable } from "../../search/embeddable";
import type { {{Pascal}}Dto } from "./schema";

// Searchable entity (ADR 0008). The text below is embedded for hybrid search (FTS + vector).
// Register {{camel}}Embeddable in packages/core/src/search/embeddables.ts.
export const {{camel}}Embeddable: Embeddable<{{Pascal}}Dto> = {
  entityType: "{{camel}}",
  toText: ({ entity }) => [entity.name].join("\n"), // TODO: add relevant text fields
  // TODO: db.{{camel}}.findMany({ where: { id: { in: [...ids] } } }) once the Prisma model exists.
  // `viewer` is set by search: return only rows that user may see.
  load: async () => [],
};
