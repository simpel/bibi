import { z } from "zod";

export const SearchInputSchema = z.object({
  query: z.string().trim().min(1).max(500).describe("Free-text query, any language"),
  entityTypes: z.array(z.string()).optional().describe("Restrict to entity types, e.g. venue"),
  limit: z.number().int().min(1).max(50).default(10),
});

export const SearchHitSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  score: z.number(),
  content: z.string(),
});

export const SearchOutputSchema = z.object({ hits: z.array(SearchHitSchema) });

export type SearchInput = z.infer<typeof SearchInputSchema>;
export type SearchHit = z.infer<typeof SearchHitSchema>;
