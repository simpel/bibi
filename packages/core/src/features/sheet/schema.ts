import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const SHEET_ROW_KINDS = ["BOOKING", "ITEM", "REQUIREMENT"] as const;
export const SheetRowKindSchema = z
  .enum(SHEET_ROW_KINDS)
  .describe("BOOKING: the booking itself. ITEM: an item on the booking. REQUIREMENT: a count.");

/** One row of a sheet snapshot. `key` is stable across versions, so rows can be compared. */
export const SheetRowSchema = z.object({
  kind: SheetRowKindSchema,
  key: z
    .string()
    .describe("Stable id: booking id, program item id, or `<program item id|booking>:<value id>`"),
  parentKey: z
    .string()
    .nullable()
    .describe("REQUIREMENT: the program item's key it applies to; null = the whole booking"),
  label: z.string().describe("Booking reference, program item name or counted list value"),
  itemName: z.string().nullable().describe("ITEM: the name of the item the program item uses"),
  quantity: z.number().int().nullable().describe("Headcount, item quantity or counted guests"),
  startsAt: z.string().nullable().describe("ISO time"),
  endsAt: z.string().nullable().describe("ISO time"),
  values: FieldValuesSchema.describe("Included field values by key; a requirement carries `list`"),
});

export const SheetContentSchema = z.object({
  rows: z.array(SheetRowSchema).describe("Booking first, then items by time, then counts"),
});

export const SHEET_CHANGE_KINDS = ["ADDED", "CHANGED", "REMOVED"] as const;

/** A row that differs from the last sent version: marked ★ when the sheet is shown. */
export const SheetChangeSchema = z.object({
  key: z.string().describe("The row's key; a REMOVED row is no longer in the content"),
  kind: SheetRowKindSchema,
  change: z.enum(SHEET_CHANGE_KINDS),
  label: z.string(),
  changed: z.array(z.string()).describe("CHANGED: which attributes or field keys differ"),
});

export const SHEET_MATCH_KINDS = ["CONTAINS", "MAY_CONTAIN"] as const;

/**
 * A count compared with an item on the booking that carries the same list value (ADR 0021).
 * `CONTAINS` (carried by the item or a mandatory part, no alternative) blocks the sheet;
 * `MAY_CONTAIN` (only optional parts or choice options) is flagged but does not block.
 */
export const SheetMatchSchema = z.object({
  programItemKey: z.string().describe("The program item's row key in `content`"),
  programItemName: z.string(),
  itemId: z.string().describe("The item the program item uses"),
  itemName: z.string(),
  vocabularyValueId: z.string().describe("The counted list value"),
  name: z.string().describe("Name of the list value"),
  quantity: z.number().int().describe("The effective count for the program item"),
  kind: z.enum(SHEET_MATCH_KINDS),
  blocking: z.boolean().describe("true for CONTAINS: the sheet cannot be sent"),
  carriers: z.array(z.string()).describe("Names of the items or parts that carry the value"),
});

export const SheetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  bookingId: z.string(),
  sheetDefinitionId: z.string(),
  version: z.number().int().describe("1, 2, 3, … per booking and sheet definition"),
  roleId: z
    .string()
    .describe("The receiving fixed role at generation (viewer, member, admin or owner)"),
  content: SheetContentSchema,
  changes: z.array(SheetChangeSchema).describe("Rows marked ★ since `baseVersion`"),
  blocked: z.boolean().describe("A count matches an item that contains it: sheet.send is refused"),
  matches: z
    .array(SheetMatchSchema)
    .describe("Counts that hit the booking's items, blocking first"),
  baseVersion: z
    .number()
    .int()
    .nullable()
    .describe("The last sent version the changes are measured against; null = none sent before"),
  sentAt: z.date().nullable(),
  sentBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const SheetGenerateInputSchema = z.object({
  bookingId: z.string().min(1).describe("Id of the booking (booking.list)"),
  sheetDefinitionId: z
    .string()
    .min(1)
    .describe("Id of the sheet definition (sheetDefinition.list)"),
});

export const SheetIdInputSchema = z.object({ id: z.string().min(1) });

export const SheetListInputSchema = z.object({
  bookingId: z.string().optional().describe("Only sheets of this booking"),
  sheetDefinitionId: z.string().optional().describe("Only versions of this sheet definition"),
  ...PageInputShape,
});

export const SheetListOutputSchema = z.object({
  items: z.array(SheetSchema),
  nextCursor: z.string().nullable(),
});

export type SheetRow = z.infer<typeof SheetRowSchema>;
export type SheetContent = z.infer<typeof SheetContentSchema>;
export type SheetChange = z.infer<typeof SheetChangeSchema>;
export type SheetMatch = z.infer<typeof SheetMatchSchema>;
export type SheetDto = z.infer<typeof SheetSchema>;
export type SheetGenerateInput = z.infer<typeof SheetGenerateInputSchema>;
