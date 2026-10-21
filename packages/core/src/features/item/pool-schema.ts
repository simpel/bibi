import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";

/**
 * The shared target selector (ADR 0059, decision 7): a specific item, or a pool (an item type plus
 * the list values every unit must carry). Bundle parts, customisation options and demands use it.
 * Flat on purpose so every surface can take it as plain arguments.
 */
export const PoolTargetShape = {
  itemId: z
    .string()
    .min(1)
    .optional()
    .describe("Target one specific item. Give this or entityTypeId, never both."),
  entityTypeId: z
    .string()
    .min(1)
    .optional()
    .describe("Target a pool: every bookable item of this type (entityType.list base ITEM)"),
  tagValueIds: z
    .array(z.string().min(1))
    .max(20)
    .default([])
    .describe("Pool only: list values (tags) every unit must carry, from the type's list fields"),
};

export const PoolFreeUnitsInputSchema = z.object({
  ...PoolTargetShape,
  startsAt: z.coerce.date().describe("Start of the window, ISO 8601"),
  endsAt: z.coerce.date().describe("End of the window (exclusive), ISO 8601"),
  ...PageInputShape,
});

export const PoolUnitSchema = z.object({
  id: z.string().describe("Item id of the unit"),
  name: z.string(),
  entityTypeId: z.string(),
});

export const PoolFreeUnitsOutputSchema = z.object({
  items: z.array(PoolUnitSchema).describe("Free units, by name then id"),
  nextCursor: z.string().nullable(),
  prepickId: z
    .string()
    .nullable()
    .describe("The unit to preselect: the first free one in pool order; null when none is free"),
});

export type PoolUnit = z.infer<typeof PoolUnitSchema>;
export type PoolFreeUnitsInput = z.infer<typeof PoolFreeUnitsInputSchema>;
export type PoolFreeUnits = z.infer<typeof PoolFreeUnitsOutputSchema>;
