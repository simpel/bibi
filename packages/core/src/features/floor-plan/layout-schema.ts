import { z } from "zod";
import { BufferMinutesShape, bufferMinutesInputShape } from "../../shared/buffers";
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
  .describe("LAYOUT: the layout's seats. MANUAL: a typed capacity. NONE: neither (no pieces)");

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

const name = z.string().trim().min(1).max(80).describe("e.g. Banquet 80; unique within the room");
const description = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .describe("What the layout is suited for, e.g. dinner with speeches and a dance floor");
const capacity = z
  .number()
  .int()
  .positive()
  .max(100_000)
  .nullable()
  .describe("Typed capacity; null = the layout's seats. Never above the room's maxPeople");

/** The facts every layout read carries, with its capacity after inheritance. */
const LayoutFactsShape = {
  id: z.string(),
  itemId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  version: z.number().int(),
  seatCount: z.number().int().describe("Chairs drawn in the layout"),
  capacity: z.number().int().nullable().describe("Typed capacity; null = the seats"),
  effectiveCapacity: z.number().int().nullable(),
  capacitySource: CapacitySourceSchema,
  ...BufferMinutesShape,
};

export const LayoutSummarySchema = z.object({
  ...LayoutFactsShape,
  elements: z.array(FloorElementSchema).describe("The layout's pieces, e.g. for a thumbnail"),
});

export const FloorPlanSchema = FloorPlanShapeSchema.extend({
  id: z.string().nullable().describe("null = nothing saved yet; the default rectangle is shown"),
  itemId: z.string(),
  version: z.number().int(),
  maxPeople: z.number().int().nullable().describe("The room's people limit; null = none"),
  elements: z.array(FloorElementSchema),
  layouts: z.array(LayoutSummarySchema).describe("Every layout of the room, by name"),
});

export const LayoutIdInputSchema = z.object({ id: z.string().min(1) });

export const LayoutCreateInputSchema = z.object({
  itemId: z.string().min(1).describe("The room (an item with SETUPS)"),
  name,
  description: description.optional(),
  capacity: capacity.optional(),
  ...bufferMinutesInputShape({ inherits: "the room's" }),
  copyFromId: z
    .string()
    .min(1)
    .optional()
    .describe("Another layout of the same room to copy the pieces, note and other fields from"),
});

export const LayoutSaveInputSchema = z.object({
  id: z.string().min(1),
  expectedVersion: version,
  name: name.optional().describe("New name; omit = unchanged"),
  description: description.optional().describe("omit = unchanged"),
  capacity: capacity.optional().describe("omit = unchanged"),
  ...bufferMinutesInputShape({ inherits: "the room's; omit = unchanged" }),
  note: z.string().trim().max(2000).nullable().optional(),
  elements: z
    .array(FloorElementInputSchema)
    .max(400)
    .describe("The layout's pieces (no fixed kinds). Replaces the whole set."),
});

export const LayoutSchema = z.object({
  ...LayoutFactsShape,
  maxPeople: z.number().int().nullable().describe("The room's people limit; null = none"),
  note: z.string().nullable(),
  elements: z.array(FloorElementSchema),
  plan: FloorPlanShapeSchema.extend({
    elements: z.array(FloorElementSchema).describe("The floor plan's fixed elements"),
  }),
  issues: z
    .array(LayoutIssueSchema)
    .describe("Problems; EXIT_BLOCKED and OVER_LIMIT refuse a save, the rest are warnings"),
});

export type FloorPlanDto = z.infer<typeof FloorPlanSchema>;
export type LayoutDto = z.infer<typeof LayoutSchema>;
export type LayoutSummaryDto = z.infer<typeof LayoutSummarySchema>;
export type LayoutSaveInput = z.input<typeof LayoutSaveInputSchema>;
export type LayoutCreateInput = z.input<typeof LayoutCreateInputSchema>;
export type FloorPlanSaveInput = z.input<typeof FloorPlanSaveInputSchema>;
