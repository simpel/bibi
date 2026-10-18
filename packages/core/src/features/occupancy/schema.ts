import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { HoldKindSchema } from "../item-state/hold-kind";

/**
 * Why a bookable item is occupied (ADR 0022, 0044). `HOLD` comes from a line's state; every row
 * except a `SOFT` hold is collision-free.
 */
export const OCCUPANCY_TYPES = ["HOLD", "SETUP", "MAINTENANCE", "INTERNAL"] as const;
export const OccupancyTypeSchema = z.enum(OCCUPANCY_TYPES);
export type OccupancyType = z.infer<typeof OccupancyTypeSchema>;

/** The types staff block by hand with `occupancy.*`; the others come from their own records. */
export const MANUAL_OCCUPANCY_TYPES = ["MAINTENANCE", "INTERNAL"] as const;
export const ManualOccupancyTypeSchema = z.enum(MANUAL_OCCUPANCY_TYPES);

export const OccupancySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  itemId: z.string(),
  type: OccupancyTypeSchema,
  /** `HOLD` only: `SOFT` (may overlap) or `HARD` (blocks), from the line's state. */
  holdKind: HoldKindSchema.nullable(),
  startsAt: z.date(),
  endsAt: z.date(),
  sourceType: z.string().nullable(),
  sourceId: z.string().nullable(),
  note: z.string().nullable(),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const OccupancyCreateInputSchema = z.object({
  itemId: z.string().min(1).describe("Id of the bookable item (item.list behaviour BOOKABLE)"),
  type: ManualOccupancyTypeSchema.describe("MAINTENANCE (out of service) or INTERNAL (own use)"),
  startsAt: z.coerce.date().describe("Start of the period, ISO 8601"),
  endsAt: z.coerce.date().describe("End of the period (exclusive), ISO 8601"),
  note: z.string().trim().max(500).nullish().describe("Why the item is blocked"),
});

export const OccupancyUpdateInputSchema = OccupancyCreateInputSchema.omit({ itemId: true })
  .partial()
  .extend({ id: z.string().min(1) });

export const OccupancyIdInputSchema = z.object({ id: z.string().min(1) });

export const OccupancyListInputSchema = z.object({
  itemId: z.string().optional().describe("Only occupancies of this item"),
  type: OccupancyTypeSchema.optional().describe("Only occupancies of this type"),
  from: z.coerce.date().optional().describe("Only periods that end after this time"),
  to: z.coerce.date().optional().describe("Only periods that start before this time"),
  ...PageInputShape,
});

export const OccupancyListOutputSchema = z.object({
  items: z.array(OccupancySchema),
  nextCursor: z.string().nullable(),
});

export type OccupancyDto = z.infer<typeof OccupancySchema>;
export type OccupancyCreateInput = z.infer<typeof OccupancyCreateInputSchema>;
export type OccupancyUpdateInput = z.infer<typeof OccupancyUpdateInputSchema>;
