import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { TaskShapeSchema } from "./task-shape";

/** Something about a task worth knowing that never blocks it (ADR 0117), derived on read. */
export const TaskWarningSchema = z.object({
  kind: z
    .enum(["ITEM_BUSY"])
    .describe(
      "ITEM_BUSY: a meeting's item has a hard hold, buffer or block overlapping the meeting",
    ),
  itemId: z.string().describe("The busy item (item.get)"),
  startsAt: z.date().describe("Start of the first overlapping occupancy"),
  endsAt: z.date().describe("End of the first overlapping occupancy"),
});

/** A task around a customer: a site visit, a tasting, a deadline (ADR 0117). */
export const TaskSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: z.object({ id: z.string(), name: z.string() }).describe("The task type (base TASK)"),
  shape: TaskShapeSchema,
  customerId: z.string().describe("customer.get"),
  contactId: z.string().describe("contact.get; a contact person at the customer"),
  orderId: z.string().nullable().describe("The linked order (order.get); null = not linked"),
  itemId: z.string().nullable().describe("The item it names (item.get), e.g. the room to show"),
  startsAt: z.date().describe("A meeting's start, or a deadline's due time"),
  endsAt: z.date().nullable().describe("A meeting's end; always null for a deadline"),
  note: z.string().nullable(),
  fields: FieldValuesSchema,
  doneAt: z.date().nullable().describe("When it was marked done; null = open"),
  doneById: z.string().nullable().describe("User id of who marked it done"),
  assigneeId: z.string().nullable().describe("User id of the assignee; null = unassigned"),
  overdue: z.boolean().describe("Open and past its end (meeting) or due time (deadline)"),
  warnings: z
    .array(TaskWarningSchema)
    .describe("Advisory, never blocking; ITEM_BUSY needs item:read"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NoteSchema = z
  .string()
  .trim()
  .max(4000)
  .nullable()
  .optional()
  .describe("Free text, at most 4000 characters; null clears it");

const TimesShape = {
  startsAt: z.coerce.date().describe("A meeting's start, or a deadline's due time"),
  endsAt: z.coerce
    .date()
    .nullable()
    .optional()
    .describe("A meeting's end (required for MEETING, after startsAt); omit or null for DEADLINE"),
};

const ItemIdSchema = z
  .string()
  .min(1)
  .nullable()
  .optional()
  .describe("An item it names (item.list), e.g. the room to show; it only warns when busy");

export const TaskCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("The task type (entityType.list base TASK)"),
  customerId: z.string().min(1).describe("The customer (customer.list)"),
  contactId: z.string().min(1).describe("A contact person at the customer (contact.list)"),
  orderId: z
    .string()
    .min(1)
    .optional()
    .describe("Link an active order of the same customer (order.list) right away"),
  itemId: ItemIdSchema,
  ...TimesShape,
  note: NoteSchema,
  assigneeId: z
    .string()
    .min(1)
    .nullish()
    .describe("User id of the assignee (member.list userId); omitted = the caller, null = none"),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

/** The customer and the linked order never change here (`task.linkOrder` sets the order). */
export const TaskUpdateInputSchema = z.object({
  id: z.string().min(1),
  entityTypeId: z
    .string()
    .min(1)
    .optional()
    .describe("Another task type; its shape must fit the times"),
  contactId: z.string().min(1).optional().describe("Another contact person at the customer"),
  itemId: ItemIdSchema,
  startsAt: TimesShape.startsAt.optional(),
  endsAt: TimesShape.endsAt,
  note: NoteSchema,
  assigneeId: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .describe("User id of the new assignee (member.list userId), told; null = none"),
  fields: FieldValuesSchema.optional().describe(
    "Changed field values by key; other fields are kept. null clears a value.",
  ),
});

export const TaskIdInputSchema = z.object({ id: z.string().min(1) });

export const TaskLinkOrderInputSchema = z.object({
  taskId: z.string().min(1),
  orderId: z.string().min(1).describe("An active order of the task's customer (order.list)"),
});

export const TASK_STATES = ["open", "done", "overdue"] as const;

export const TaskListInputSchema = z.object({
  customerId: z.string().min(1).optional().describe("Only tasks of this customer"),
  orderId: z.string().min(1).optional().describe("Only tasks linked to this order"),
  assigneeId: z.string().min(1).optional().describe("Only tasks assigned to this user"),
  state: z
    .enum(TASK_STATES)
    .optional()
    .describe("open: not done; done; overdue: open and past its end or due time"),
  from: z.coerce
    .date()
    .optional()
    .describe("Only tasks that end (or are due) at or after this instant"),
  to: z.coerce.date().optional().describe("Only tasks that start before this instant"),
  page: z
    .number()
    .int()
    .min(1)
    .max(100_000)
    .optional()
    .describe("Page number (from 1) of `limit` tasks; returns `total`. Replaces `cursor`"),
  ...PageInputShape,
});

export const TaskListOutputSchema = z.object({
  items: z.array(TaskSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().nullable().describe("The number of matching tasks; only with `page`"),
});

export type TaskDto = z.infer<typeof TaskSchema>;
export type TaskWarning = z.infer<typeof TaskWarningSchema>;
export type TaskCreateInput = z.infer<typeof TaskCreateInputSchema>;
export type TaskUpdateInput = z.infer<typeof TaskUpdateInputSchema>;
export type TaskLinkOrderInput = z.infer<typeof TaskLinkOrderInputSchema>;
export type TaskListInput = z.infer<typeof TaskListInputSchema>;
