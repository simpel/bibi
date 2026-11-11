import { z } from "zod";

export const ITEM_SUMMARY_SAMPLE_SIZE = 3;

export const ItemSummaryInputSchema = z.object({
  venueId: z.string().min(1).describe("The venue whose items to count (venue.list)"),
});

export const ItemSummaryTypeSchema = z.object({
  entityTypeId: z.string().describe("The item type (entityType.list)"),
  count: z.number().int().describe("Active catalog items of this type in the venue"),
  sampleNames: z
    .array(z.string())
    .describe(`The first ${ITEM_SUMMARY_SAMPLE_SIZE} item names of this type, by name`),
});

export const ItemSummaryOutputSchema = z.object({
  total: z.number().int().describe("Active catalog items in the venue"),
  types: z.array(ItemSummaryTypeSchema).describe("One entry per item type, most items first"),
});

export type ItemSummaryDto = z.infer<typeof ItemSummaryOutputSchema>;
