import { z } from "zod";
import { FieldValuesSchema } from "../field-definition/field-values-schema";

export const WORK_ORDER_ROW_KINDS = ["TICKET", "ITEM", "REQUIREMENT"] as const;
export const WorkOrderRowKindSchema = z
  .enum(WORK_ORDER_ROW_KINDS)
  .describe("TICKET: the ticket itself. ITEM: an item on the ticket. REQUIREMENT: a count.");

/** One row of a work order snapshot. `key` is stable across versions, so rows can be compared. */
export const WorkOrderRowSchema = z.object({
  kind: WorkOrderRowKindSchema,
  key: z.string().describe("Stable id: ticket id, line id, or `<line id|ticket>:<value id>`"),
  parentKey: z
    .string()
    .nullable()
    .describe(
      "REQUIREMENT: the line's key it applies to; null = the whole ticket. ITEM: an add-on's " +
        "parent line's row when that line is on the work order (ADR 0088); the row follows it",
    ),
  addOnTo: z
    .string()
    .optional()
    .describe(
      "ITEM add-on (ADR 0088): the name of the line it is sold with; without parentKey the " +
        "parent is not on this work order and the row stands alone",
    ),
  label: z
    .string()
    .describe(
      "TICKET: its title and reference ('Kick-off · #41'), or the reference alone; else the line " +
        "name or counted list value",
    ),
  itemName: z.string().nullable().describe("ITEM: the name of the item the line uses"),
  quantity: z.number().int().nullable().describe("Headcount, item quantity or counted guests"),
  startsAt: z.string().nullable().describe("ISO time"),
  endsAt: z.string().nullable().describe("ISO time"),
  values: FieldValuesSchema.describe("Included field values by key; a requirement carries `list`"),
});

export const WorkOrderContentSchema = z.object({
  rows: z.array(WorkOrderRowSchema).describe("Ticket first, then items by time, then counts"),
});

export const WORK_ORDER_CHANGE_KINDS = ["ADDED", "CHANGED", "REMOVED"] as const;

/** A row that differs from the last sent version: marked ★ when the work order is shown. */
export const WorkOrderChangeSchema = z.object({
  key: z.string().describe("The row's key; a REMOVED row is no longer in the content"),
  kind: WorkOrderRowKindSchema,
  change: z.enum(WORK_ORDER_CHANGE_KINDS),
  label: z.string(),
  changed: z.array(z.string()).describe("CHANGED: which attributes or field keys differ"),
});

export const WORK_ORDER_MATCH_KINDS = ["CONTAINS", "MAY_CONTAIN"] as const;

/**
 * A count compared with an item on the ticket that carries the same list value (ADR 0021).
 * `CONTAINS` (carried by the item or a mandatory part, no alternative) blocks the work order;
 * `MAY_CONTAIN` (only optional parts or choice options) is flagged but does not block.
 */
export const WorkOrderMatchSchema = z.object({
  lineKey: z.string().describe("The line's row key in `content`"),
  lineName: z.string(),
  itemId: z.string().describe("The item the line uses"),
  itemName: z.string(),
  vocabularyValueId: z.string().describe("The counted list value"),
  name: z.string().describe("Name of the list value"),
  quantity: z.number().int().describe("The effective count for the line"),
  kind: z.enum(WORK_ORDER_MATCH_KINDS),
  blocking: z.boolean().describe("true for CONTAINS: the work order cannot be sent"),
  carriers: z.array(z.string()).describe("Names of the items or parts that carry the value"),
});

export const WORK_ORDER_RECIPIENT_ROLES = ["ASSIGNEE", "FOLLOWER"] as const;

export const WorkOrderRecipientSchema = z.object({
  userId: z.string().describe("User id of the member who received the work order"),
  role: z.enum(WORK_ORDER_RECIPIENT_ROLES).describe("Assignee or follower of the responsibility"),
});

export const WorkOrderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ticketId: z.string(),
  workOrderDefinitionId: z.string(),
  version: z.number().int().describe("1, 2, 3, … per ticket and work order definition"),
  responsibilityId: z.string().describe("The receiving responsibility at generation"),
  content: WorkOrderContentSchema,
  changes: z.array(WorkOrderChangeSchema).describe("Rows marked ★ since `baseVersion`"),
  blocked: z
    .boolean()
    .describe("A count matches an item that contains it: workOrder.send is refused"),
  matches: z
    .array(WorkOrderMatchSchema)
    .describe("Counts that hit the ticket's items, blocking first"),
  baseVersion: z
    .number()
    .int()
    .nullable()
    .describe("The last sent version the changes are measured against; null = none sent before"),
  current: z
    .boolean()
    .describe("true on the newest version of its ticket and definition; older ones are history"),
  sentAt: z.date().nullable(),
  sentBy: z.string().nullable(),
  recipients: z
    .array(WorkOrderRecipientSchema)
    .describe(
      "Who received it: the responsibility's assignee and followers on the ticket when it was " +
        "sent (a snapshot, ADR 0055); empty until sent",
    ),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const WorkOrderGenerateInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list)"),
  workOrderDefinitionId: z
    .string()
    .min(1)
    .describe("Id of the work order definition (workOrderDefinition.list)"),
});

export const WorkOrderIdInputSchema = z.object({ id: z.string().min(1) });

export type WorkOrderRow = z.infer<typeof WorkOrderRowSchema>;
export type WorkOrderContent = z.infer<typeof WorkOrderContentSchema>;
export type WorkOrderChange = z.infer<typeof WorkOrderChangeSchema>;
export type WorkOrderMatch = z.infer<typeof WorkOrderMatchSchema>;
export type WorkOrderDto = z.infer<typeof WorkOrderSchema>;
export type WorkOrderGenerateInput = z.infer<typeof WorkOrderGenerateInputSchema>;
