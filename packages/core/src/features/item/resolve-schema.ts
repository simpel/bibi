import { z } from "zod";
import { PriceUnitSchema } from "./schema";

export const ItemResolveInputSchema = z.object({
  id: z.string().min(1).describe("Id of the item to expand"),
});

export const ResolvedItemNodeSchema = z.object({
  path: z
    .array(z.string())
    .describe("Item ids from the resolved item down to this node, both included"),
  depth: z.number().int().describe("0 = the resolved item itself, 1 = its parts, and so on"),
  itemId: z.string(),
  name: z.string(),
  entityTypeId: z.string(),
  quantity: z.number().int().describe("How many per parent (1 for the resolved item)"),
  totalQuantity: z.number().int().describe("How many per one of the resolved item"),
  offsetMinutes: z.number().int().describe("Start relative to the start of the resolved item"),
  durationMinutes: z.number().int().nullable().describe("Own length; null = the parent's length"),
  required: z.boolean().describe("The part is mandatory in its parent (true for the root)"),
  choiceGroup: z.string().nullable().describe("Name of the choice group it is an option in"),
  mandatory: z
    .boolean()
    .describe("Included whatever is chosen: every step from the root is mandatory, no option"),
  priceMinor: z.number().int().nullable(),
  priceUnit: PriceUnitSchema.nullable(),
  vatRatePercent: z.number().int().nullable(),
  tags: z.array(z.string()).describe("Ids of the list values the item itself carries"),
});

export const ResolvedTagSchema = z.object({
  valueId: z.string().describe("Id of the list value (vocabulary value)"),
  vocabularyId: z.string(),
  name: z.string(),
  itemIds: z.array(z.string()).describe("The items in the tree that carry the value"),
});

export const ItemResolutionSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  nodes: z
    .array(ResolvedItemNodeSchema)
    .describe("The expanded tree, depth first; parts in order of offset"),
  contains: z
    .array(ResolvedTagSchema)
    .describe("List values carried by the item or by a mandatory part at any level"),
  mayContain: z
    .array(ResolvedTagSchema)
    .describe("List values only carried by optional parts or choice options, per option"),
});

export type ResolvedItemNode = z.infer<typeof ResolvedItemNodeSchema>;
export type ResolvedTag = z.infer<typeof ResolvedTagSchema>;
export type ItemResolution = z.infer<typeof ItemResolutionSchema>;
