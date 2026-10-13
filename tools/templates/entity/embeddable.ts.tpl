import type { Embeddable } from "@okazi/core"; // TODO: bekräfta typnamn i packages/core
import type { {{Pascal}} } from "./schema";

// Sökbar entitet (ADR 0008). Texten nedan bäddas in för hybridsökning (FTS + vektor).
// TODO: anpassa till Embeddable-gränssnittets faktiska form i packages/core.
export const {{camel}}Embeddable = {
  kind: "{{kebab}}",
  toEmbeddingText({ entity }: { entity: {{Pascal}} }): string {
    return [entity.name].join("\n"); // TODO: lägg till relevanta textfält
  },
} satisfies Embeddable<{{Pascal}}>;
