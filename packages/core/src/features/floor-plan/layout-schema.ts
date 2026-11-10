import { z } from "zod";
import { isSimpleOutline } from "./outline";
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
}).superRefine((plan, issues) => {
  if (!isSimpleOutline({ outline: plan.outline })) {
    issues.addIssue({
      code: "custom",
      path: ["outline"],
      message: "The walls cross or touch each other, or two corners are the same point",
    });
  }
  const outside = plan.outline.some(
    ([x, y]) => x < 0 || y < 0 || x > plan.widthCm || y > plan.depthCm,
  );
  if (outside) {
    issues.addIssue({
      code: "custom",
      path: ["outline"],
      message: "Every corner must lie within 0..widthCm and 0..depthCm",
    });
  }
});

export const SetupCapacitySchema = z.object({
  setupId: z.string(),
  seatCount: z
    .number()
    .int()
    .nullable()
    .describe("The most seats of the item's layouts for this setup; null = none drawn"),
  capacity: z.number().int().nullable().describe("Typed capacity; null = the largest layout's"),
  effectiveCapacity: z.number().int().nullable(),
  capacitySource: CapacitySourceSchema,
});

export const LayoutSummarySchema = z.object({
  id: z.string(),
  setupId: z.string(),
  name: z.string(),
  version: z.number().int(),
  seatCount: z.number().int(),
  elements: z.array(FloorElementSchema).describe("The layout's pieces, e.g. for a thumbnail"),
});

export const FloorPlanSchema = FloorPlanShapeSchema.extend({
  id: z.string().nullable().describe("null = nothing saved yet; the default rectangle is shown"),
  itemId: z.string(),
  version: z.number().int(),
  elements: z.array(FloorElementSchema),
  setups: z.array(SetupCapacitySchema).describe("One per setup the item has"),
  layouts: z
    .array(LayoutSummarySchema)
    .describe("Every layout of the item, by setup in the item's order, then by name"),
});

const name = z.string().trim().min(1).max(80).describe("e.g. Banquet 80; unique within the item");

export const SetupLayoutIdInputSchema = z.object({ id: z.string().min(1) });

export const SetupLayoutCreateInputSchema = z.object({
  itemId: z.string().min(1),
  setupId: z.string().min(1).describe("One of the item's setups"),
  name,
  copyFromId: z
    .string()
    .min(1)
    .optional()
    .describe("Another layout of the same item to copy the pieces and note from"),
});

const capacity = z
  .number()
  .int()
  .positive()
  .max(100_000)
  .nullable()
  .optional()
  .describe(
    "Typed capacity for the layout's setup in this item; null = the largest layout's seats; omit = unchanged",
  );

export const SetupLayoutSaveInputSchema = z.object({
  id: z.string().min(1),
  expectedVersion: version,
  name: name.optional().describe("New name; omit = unchanged"),
  note: z.string().trim().max(2000).nullable().optional(),
  capacity,
  elements: z
    .array(FloorElementInputSchema)
    .max(400)
    .describe("The layout's pieces (no fixed kinds). Replaces the whole set."),
});

export const SetupLayoutSchema = SetupCapacitySchema.omit({ seatCount: true }).extend({
  id: z.string(),
  itemId: z.string(),
  name: z.string(),
  version: z.number().int(),
  note: z.string().nullable(),
  seatCount: z.number().int().describe("This layout's seats"),
  elements: z.array(FloorElementSchema),
  plan: FloorPlanShapeSchema.extend({
    elements: z.array(FloorElementSchema).describe("The floor plan's fixed elements"),
  }),
  issues: z.array(LayoutIssueSchema).describe("Warnings; they never block a save"),
});

export type FloorPlanDto = z.infer<typeof FloorPlanSchema>;
export type SetupLayoutDto = z.infer<typeof SetupLayoutSchema>;
export type LayoutSummaryDto = z.infer<typeof LayoutSummarySchema>;
export type SetupCapacityDto = z.infer<typeof SetupCapacitySchema>;
export type SetupLayoutSaveInput = z.input<typeof SetupLayoutSaveInputSchema>;
export type SetupLayoutCreateInput = z.input<typeof SetupLayoutCreateInputSchema>;
export type FloorPlanSaveInput = z.input<typeof FloorPlanSaveInputSchema>;
