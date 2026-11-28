import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";
import { FieldValuesSchema } from "../field-definition/field-values-schema";
import { TaskItemSchema, TaskItemsInputSchema } from "./task-item-schema";

/** A task (ADR 0117, 0120): a site visit, a tasting, a deadline or a note to self. */
export const TaskSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: z.object({ id: z.string(), name: z.string() }).describe("The task type (base TASK)"),
  customerId: z.string().nullable().describe("customer.get; null = no customer"),
  contactId: z
    .string()
    .nullable()
    .describe("contact.get; a contact person at the customer; null = none"),
  orderId: z.string().nullable().describe("The linked order (order.get); null = not linked"),
  statusId: z
    .string()
    .nullable()
    .describe(
      "Its pipeline status while it has no order (orderStatus.list, ADR 0121): on the board " +
        "while open; null when linked to an order or no status holds tasks. Moved with task.move",
    ),
  dueAt: z
    .date()
    .nullable()
    .describe("When it is due: one instant; null = no due time (not on the calendar)"),
  items: z
    .array(TaskItemSchema)
    .describe("The rooms it concerns (ADR 0120): related, prebooked (soft) or booked (hard)"),
  note: z.string().nullable(),
  fields: FieldValuesSchema,
  doneAt: z.date().nullable().describe("When it was marked done; null = open"),
  doneById: z.string().nullable().describe("User id of who marked it done"),
  assigneeId: z.string().nullable().describe("User id of the assignee; null = unassigned"),
  overdue: z.boolean().describe("Open with a due time in the past"),
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

const DueAtSchema = z.coerce
  .date()
  .describe("When it is due: one instant, never a span (ADR 0120)");

export const TaskCreateInputSchema = z.object({
  entityTypeId: z.string().min(1).describe("The task type (entityType.list base TASK)"),
  customerId: z.string().min(1).optional().describe("The customer (customer.list); optional"),
  contactId: z
    .string()
    .min(1)
    .optional()
    .describe("A contact person at the customer (contact.list); needs customerId"),
  orderId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Link an active order of the same customer (order.list) right away; needs customerId",
    ),
  dueAt: DueAtSchema.optional(),
  items: TaskItemsInputSchema.optional(),
  note: NoteSchema,
  assigneeId: z
    .string()
    .min(1)
    .nullish()
    .describe("User id of the assignee (member.list userId); omitted = the caller, null = none"),
  fields: FieldValuesSchema.optional().describe("Values of the type's own fields, by field key"),
});

/** Everything but the type may be cleared (ADR 0117 amended, 0120); the order stays at the customer. */
export const TaskUpdateInputSchema = z.object({
  id: z.string().min(1),
  entityTypeId: z.string().min(1).optional().describe("Another task type"),
  customerId: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .describe(
      "Another customer: pass contactId (at it) and orderId null (or one of its orders). null " +
        "clears the customer; then contactId and orderId must be null too (or already empty)",
    ),
  contactId: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .describe("Another contact person at the customer; null clears it"),
  orderId: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .describe("Another active order of the task's customer (order.list); null unlinks"),
  dueAt: DueAtSchema.nullable().optional().describe("A new due time; null clears it"),
  items: TaskItemsInputSchema.optional().describe(
    "Replaces the task's rooms as a set (omitted = unchanged, [] = none). A prebook or book " +
      "holds its window while the task is open; a book that collides is CONFLICT at items.<i>",
  ),
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

export const TaskMoveInputSchema = z.object({
  id: z.string().min(1).describe("A task without an order that is not done"),
  statusId: z
    .string()
    .min(1)
    .describe("The status to move it to: one that holds tasks (orderStatus.list `tasks`)"),
});

export const TASK_STATES = ["open", "done", "overdue"] as const;

export const TaskListInputSchema = z.object({
  customerId: z.string().min(1).optional().describe("Only tasks of this customer"),
  orderId: z.string().min(1).optional().describe("Only tasks linked to this order"),
  assigneeId: z.string().min(1).optional().describe("Only tasks assigned to this user"),
  statusId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Only tasks in this pipeline status (orderStatus.list); tasks with an order have none",
    ),
  state: z
    .enum(TASK_STATES)
    .optional()
    .describe("open: not done; done; overdue: open with a due time in the past"),
  from: z.coerce
    .date()
    .optional()
    .describe("Only tasks due at or after this instant (tasks without a due time drop out)"),
  to: z.coerce
    .date()
    .optional()
    .describe("Only tasks due before this instant (tasks without a due time drop out)"),
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
export type TaskCreateInput = z.infer<typeof TaskCreateInputSchema>;
export type TaskUpdateInput = z.infer<typeof TaskUpdateInputSchema>;
export type TaskLinkOrderInput = z.infer<typeof TaskLinkOrderInputSchema>;
export type TaskMoveInput = z.infer<typeof TaskMoveInputSchema>;
export type TaskListInput = z.infer<typeof TaskListInputSchema>;
