import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { LAYOUT_ISSUE_KINDS } from "./layout-issues";
import { FLOOR_SHAPES } from "./seats";

export const FloorShapeSchema = z
  .enum(FLOOR_SHAPES)
  .describe(
    "RECT: a body with chairs per side. ROUND: a body with chairs around it. SEAT_ROW: a row of " +
      "chairs. ZONE: an outlined area without chairs. DOOR, WINDOW: an opening in a wall " +
      "(always fixed, never seated, placed on the nearest wall).",
  );

const cm = z.number().int().min(10).max(5000);
const count = z.number().int().min(0).max(60);
const swing = z
  .number()
  .int()
  .min(0)
  .max(180)
  .describe("DOOR, WINDOW: how far it opens in degrees (0 = sliding door or fixed pane)");

const SeatCountsShape = {
  seats: count.describe("ROUND: chairs around the body. SEAT_ROW: chairs in the row."),
  seatsTop: count.describe("RECT: chairs along the top side (the element's own frame)."),
  seatsRight: count.describe("RECT: chairs along the right end."),
  seatsBottom: count.describe("RECT: chairs along the bottom side."),
  seatsLeft: count.describe("RECT: chairs along the left end."),
};

export const FloorElementKindSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  shape: FloorShapeSchema,
  widthCm: z.number().int(),
  depthCm: z.number().int(),
  ...SeatCountsShape,
  fixed: z.boolean(),
  keepClearCm: z.number().int().nullable(),
  swingDeg: z.number().int().nullable(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const FloorElementKindCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(100).describe("Library name, e.g. Round table Ø180"),
  shape: FloorShapeSchema,
  widthCm: cm.describe("Width in centimetres (the diameter for ROUND)"),
  depthCm: cm.describe("Depth in centimetres (ignored for ROUND)"),
  seats: SeatCountsShape.seats.optional(),
  seatsTop: SeatCountsShape.seatsTop.optional(),
  seatsRight: SeatCountsShape.seatsRight.optional(),
  seatsBottom: SeatCountsShape.seatsBottom.optional(),
  seatsLeft: SeatCountsShape.seatsLeft.optional(),
  fixed: z
    .boolean()
    .optional()
    .describe("Part of the room itself (a door, a pillar): placed in the floor plan only"),
  keepClearCm: z
    .number()
    .int()
    .min(10)
    .max(1000)
    .nullable()
    .optional()
    .describe("Depth of the area in front of it that must stay clear (not for DOOR, WINDOW)"),
  swingDeg: swing.nullable().optional(),
});

export const FloorElementKindUpdateInputSchema = FloorElementKindCreateInputSchema.omit({
  shape: true,
  fixed: true,
})
  .partial()
  .extend({ id: z.string().min(1) });

export const FloorElementKindIdInputSchema = z.object({ id: z.string().min(1) });

export const FloorElementKindListInputSchema = z.object(PageInputShape);

export const FloorElementKindListOutputSchema = z.object({
  items: z.array(FloorElementKindSchema),
  nextCursor: z.string().nullable(),
});

export const FloorElementKindImportInputSchema = z.object({
  template: z.enum(["conference-banquet"]).describe("Starter library to import"),
});

export const FloorElementKindImportOutputSchema = z.object({
  created: z.number().int(),
  skipped: z.number().int().describe("Kinds whose name already existed"),
});

const nullableCm = cm.nullable().optional();
const nullableCount = count.nullable().optional();

export const FloorElementInputSchema = z.object({
  kindId: z.string().min(1),
  xCm: z.number().int().min(-1000).max(20_000).describe("Centre, from the plan's left edge"),
  yCm: z.number().int().min(-1000).max(20_000).describe("Centre, from the plan's top edge"),
  rotationDeg: z.number().int().min(0).max(359).default(0),
  widthCm: nullableCm.describe("Own width; null = the kind's"),
  depthCm: nullableCm.describe("Own depth; null = the kind's"),
  seats: nullableCount.describe("ROUND, SEAT_ROW: own chair count; null = the kind's"),
  seatsTop: nullableCount.describe("RECT: own chairs on the top side; null = the kind's"),
  seatsRight: nullableCount.describe("RECT: own chairs on the right end; null = the kind's"),
  seatsBottom: nullableCount.describe("RECT: own chairs on the bottom side; null = the kind's"),
  seatsLeft: nullableCount.describe("RECT: own chairs on the left end; null = the kind's"),
  swingDeg: swing.nullable().optional().describe("DOOR, WINDOW: own opening angle; null = kind's"),
  label: z.string().trim().max(40).nullable().optional().describe("e.g. a table number"),
});

const SeatSidesSchema = z.object({
  top: z.number().int(),
  right: z.number().int(),
  bottom: z.number().int(),
  left: z.number().int(),
});

export const FloorElementSchema = FloorElementInputSchema.required().extend({
  id: z.string(),
  rotationDeg: z.number().int(),
  shape: FloorShapeSchema,
  fixed: z.boolean(),
  keepClearCm: z.number().int().nullable(),
  effectiveWidthCm: z.number().int(),
  effectiveDepthCm: z.number().int(),
  effectiveAround: z.number().int().describe("ROUND, SEAT_ROW: chairs after inheritance"),
  effectiveSides: SeatSidesSchema.describe("RECT: chairs per side after inheritance"),
  effectiveSwingDeg: z.number().int().describe("DOOR, WINDOW: opening angle after inheritance"),
  seatCount: z.number().int(),
});

export const OutlineSchema = z
  .array(z.tuple([z.number().int(), z.number().int()]))
  .min(3)
  .max(64)
  .describe("The walls as [x, y] points in centimetres, clockwise");

export const LayoutIssueSchema = z.object({
  kind: z.enum(LAYOUT_ISSUE_KINDS),
  elementIds: z.array(z.string()),
});

export type FloorElementKindDto = z.infer<typeof FloorElementKindSchema>;
export type FloorElementKindCreateInput = z.infer<typeof FloorElementKindCreateInputSchema>;
export type FloorElementInput = z.input<typeof FloorElementInputSchema>;
export type FloorElementDto = z.infer<typeof FloorElementSchema>;
export type FloorElementKindImportOutput = z.infer<typeof FloorElementKindImportOutputSchema>;
