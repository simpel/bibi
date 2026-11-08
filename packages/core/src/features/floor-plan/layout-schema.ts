import { z } from "zod";
import {
  FloorElementInputSchema,
  FloorElementSchema,
  LayoutIssueSchema,
  OutlineSchema,
} from "./schema";

const version = z
  .number()
  .int()
  .min(0)
  .describe("The version you loaded (0 = none saved yet); a newer saved version gives CONFLICT");

export const CapacitySourceSchema = z
  .enum(["LAYOUT", "MANUAL", "NONE"])
  .describe("LAYOUT: the layout's seats. MANUAL: a typed capacity. NONE: neither");

export const FloorPlanShapeSchema = z.object({
  widthCm: z.number().int().min(100).max(20_000),
  depthCm: z.number().int().min(100).max(20_000),
  outline: OutlineSchema,
  minAisleCm: z.number().int().min(30).max(500).nullable(),
});

export const FloorPlanItemInputSchema = z.object({ itemId: z.string().min(1) });

export const FloorPlanSaveInputSchema = FloorPlanShapeSchema.extend({
  itemId: z.string().min(1),
  expectedVersion: version,
  elements: z
    .array(FloorElementInputSchema)
    .max(200)
    .describe("Fixed elements only (doors, pillars). Replaces the whole set."),
});

export const LayoutSummarySchema = z.object({
  setupId: z.string(),
  layoutId: z.string().nullable(),
  seatCount: z.number().int().nullable().describe("null = no layout drawn"),
  capacity: z.number().int().nullable().describe("Typed capacity; null = the layout's seats"),
  effectiveCapacity: z.number().int().nullable(),
  capacitySource: CapacitySourceSchema,
});

export const FloorPlanSchema = FloorPlanShapeSchema.extend({
  id: z.string().nullable().describe("null = nothing saved yet; the default rectangle is shown"),
  itemId: z.string(),
  version: z.number().int(),
  elements: z.array(FloorElementSchema),
  layouts: z.array(LayoutSummarySchema).describe("One per setup the item has"),
});

export const SetupLayoutKeyInputSchema = z.object({
  itemId: z.string().min(1),
  setupId: z.string().min(1).describe("One of the item's setups"),
});

export const SetupLayoutSaveInputSchema = SetupLayoutKeyInputSchema.extend({
  expectedVersion: version,
  note: z.string().trim().max(2000).nullable().optional(),
  capacity: z
    .number()
    .int()
    .positive()
    .max(100_000)
    .nullable()
    .optional()
    .describe("Typed capacity for this setup; null = use the layout's seats; omit = unchanged"),
  elements: z
    .array(FloorElementInputSchema)
    .max(400)
    .describe("The layout's pieces (no fixed kinds). Replaces the whole set."),
});

export const SetupLayoutSchema = LayoutSummarySchema.extend({
  itemId: z.string(),
  version: z.number().int(),
  note: z.string().nullable(),
  elements: z.array(FloorElementSchema),
  plan: FloorPlanShapeSchema.extend({
    elements: z.array(FloorElementSchema).describe("The floor plan's fixed elements"),
  }),
  issues: z.array(LayoutIssueSchema).describe("Warnings; they never block a save"),
});

export type FloorPlanDto = z.infer<typeof FloorPlanSchema>;
export type SetupLayoutDto = z.infer<typeof SetupLayoutSchema>;
export type LayoutSummaryDto = z.infer<typeof LayoutSummarySchema>;
export type SetupLayoutSaveInput = z.input<typeof SetupLayoutSaveInputSchema>;
export type FloorPlanSaveInput = z.input<typeof FloorPlanSaveInputSchema>;
