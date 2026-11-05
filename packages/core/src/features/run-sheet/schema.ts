import { z } from "zod";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const RUN_SHEET_ROW_KINDS = ["ORDER", "ITEM", "REQUIREMENT"] as const;
export const RunSheetRowKindSchema = z
  .enum(RUN_SHEET_ROW_KINDS)
  .describe("ORDER: the order itself. ITEM: an item on the order. REQUIREMENT: a count.");

/** One row of a run sheet snapshot. `key` is stable across versions, so rows can be compared. */
export const RunSheetRowSchema = z.object({
  kind: RunSheetRowKindSchema,
  key: z.string().describe("Stable id: order id, line id, or `<line id|order>:<value id>`"),
  parentKey: z
    .string()
    .nullable()
    .describe(
      "REQUIREMENT: the line's key it applies to; null = the whole order. ITEM: an add-on's " +
        "parent line's row when that line is on the run sheet (ADR 0088); the row follows it",
    ),
  addOnTo: z
    .string()
    .optional()
    .describe(
      "ITEM add-on (ADR 0088): the name of the line it is sold with; without parentKey the " +
        "parent is not on this run sheet and the row stands alone",
    ),
  label: z
    .string()
    .describe(
      "ORDER: its title and reference ('Kick-off · #41'), or the reference alone; else the line " +
        "name or counted list value",
    ),
  itemName: z.string().nullable().describe("ITEM: the name of the item the line uses"),
  quantity: z.number().int().nullable().describe("Headcount, item quantity or counted guests"),
  startsAt: z.string().nullable().describe("ISO time"),
  endsAt: z.string().nullable().describe("ISO time"),
  values: FieldValuesSchema.describe("Included field values by key; a requirement carries `list`"),
});

export const RunSheetContentSchema = z.object({
  rows: z.array(RunSheetRowSchema).describe("Order first, then items by time, then counts"),
});

export const RUN_SHEET_CHANGE_KINDS = ["ADDED", "CHANGED", "REMOVED"] as const;

/** A row that differs from the last sent version: marked ★ when the run sheet is shown. */
export const RunSheetChangeSchema = z.object({
  key: z.string().describe("The row's key; a REMOVED row is no longer in the content"),
  kind: RunSheetRowKindSchema,
  change: z.enum(RUN_SHEET_CHANGE_KINDS),
  label: z.string(),
  changed: z.array(z.string()).describe("CHANGED: which attributes or field keys differ"),
});

export const RUN_SHEET_MATCH_KINDS = ["CONTAINS", "MAY_CONTAIN"] as const;

/**
 * A count compared with an item on the order that carries the same list value (ADR 0021).
 * `CONTAINS` (carried by the item or a mandatory part, no alternative) blocks the run sheet;
 * `MAY_CONTAIN` (only optional parts or choice options) is flagged but does not block.
 */
export const RunSheetMatchSchema = z.object({
  lineKey: z.string().describe("The line's row key in `content`"),
  lineName: z.string(),
  itemId: z.string().describe("The item the line uses"),
  itemName: z.string(),
  vocabularyValueId: z.string().describe("The counted list value"),
  name: z.string().describe("Name of the list value"),
  quantity: z.number().int().describe("The effective count for the line"),
  kind: z.enum(RUN_SHEET_MATCH_KINDS),
  blocking: z.boolean().describe("true for CONTAINS: the run sheet cannot be sent"),
  carriers: z.array(z.string()).describe("Names of the items or parts that carry the value"),
});

export const RUN_SHEET_RECIPIENT_ROLES = ["ASSIGNEE", "FOLLOWER"] as const;

export const RunSheetRecipientSchema = z.object({
  userId: z.string().describe("User id of the member who received the run sheet"),
  role: z.enum(RUN_SHEET_RECIPIENT_ROLES).describe("Assignee or follower of the responsibility"),
});

export const RunSheetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  orderId: z.string(),
  runSheetDefinitionId: z.string(),
  version: z.number().int().describe("1, 2, 3, … per order and run sheet definition"),
  responsibilityId: z.string().describe("The receiving responsibility at generation"),
  content: RunSheetContentSchema,
  changes: z.array(RunSheetChangeSchema).describe("Rows marked ★ since `baseVersion`"),
  blocked: z
    .boolean()
    .describe("A count matches an item that contains it: runSheet.send is refused"),
  matches: z
    .array(RunSheetMatchSchema)
    .describe("Counts that hit the order's items, blocking first"),
  baseVersion: z
    .number()
    .int()
    .nullable()
    .describe(
      "The last published version the changes are measured against; null = none published before",
    ),
  current: z
    .boolean()
    .describe("true on the newest version of its order and definition; older ones are history"),
  publishedAt: z.date().nullable(),
  publishedBy: z.string().nullable(),
  fulfilledAt: z.date().nullable(),
  fulfilledBy: z.string().nullable(),
  recipients: z
    .array(RunSheetRecipientSchema)
    .describe(
      "Who received it: the responsibility's assignee and followers on the order when it was " +
        "published (a snapshot, ADR 0055); empty until published",
    ),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const RUN_SHEET_STATUSES = [
  "DRAFT",
  "BLOCKED",
  "PENDING",
  "REVISION_PENDING",
  "FULFILLED",
] as const;

export type RunSheetStatus = (typeof RUN_SHEET_STATUSES)[number];

export type DeriveRunSheetStatusInput = {
  blocked?: boolean;
  publishedAt?: Date | string | null;
  baseVersion?: number | null;
  fulfilledAt?: Date | string | null;
};

/** Derives the operational status of a run sheet from its flags and timestamps. */
export function deriveRunSheetStatus({
  blocked,
  publishedAt,
  baseVersion,
  fulfilledAt,
}: DeriveRunSheetStatusInput): RunSheetStatus {
  if (fulfilledAt) return "FULFILLED";
  if (blocked) return "BLOCKED";
  if (!publishedAt) {
    return baseVersion !== null ? "REVISION_PENDING" : "DRAFT";
  }
  return "PENDING";
}

export const RunSheetGenerateInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order (order.list)"),
  runSheetDefinitionId: z
    .string()
    .min(1)
    .describe("Id of the run sheet definition (runSheetDefinition.list)"),
});

export const RunSheetIdInputSchema = z.object({ id: z.string().min(1) });

export type RunSheetRow = z.infer<typeof RunSheetRowSchema>;
export type RunSheetContent = z.infer<typeof RunSheetContentSchema>;
export type RunSheetChange = z.infer<typeof RunSheetChangeSchema>;
export type RunSheetMatch = z.infer<typeof RunSheetMatchSchema>;
export type RunSheetDto = z.infer<typeof RunSheetSchema>;
export type RunSheetGenerateInput = z.infer<typeof RunSheetGenerateInputSchema>;
