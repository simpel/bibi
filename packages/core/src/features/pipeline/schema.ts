import { z } from "zod";
import { MyWorkFlagSchema } from "../my-work/schema";
import { NextTaskSchema } from "./next-task-schema";

export const PipelineStatusSchema = z.object({
  id: z.string().describe("The order status id"),
  title: z.string().describe("The status name"),
  color: z.string().describe("The status colour"),
  closed: z.boolean().describe("A closing status"),
  entry: z.boolean().describe("New orders start in this status"),
  tasks: z.boolean().describe("Tasks can be here (ADR 0121): a drop zone for task cards, too"),
});

export const PipelineColumnSchema = z.object({
  id: z.string().describe("The board phase id"),
  title: z.string().describe("The phase name"),
  closed: z.boolean().describe("Every status of the phase closes; shown as a closed lane"),
  statuses: z
    .array(PipelineStatusSchema)
    .describe("The order statuses in this column, in status order: one drop zone each"),
});

export const PipelineCardSchema = z.object({
  kind: z.enum(["order"]).describe("An order card (task cards are in `taskCards`)"),
  id: z.string().describe("Order id"),
  columnId: z.string().describe("The board phase (column) the order shows in"),
  statusId: z.string().describe("The order's status id"),
  reference: z.number().int().describe("Order reference number"),
  title: z.string().nullable().describe("The order's title; null until it has one"),
  typeName: z.string(),
  customerId: z
    .string()
    .describe("The order's customer id; resolve its name with customer.get or customer.list"),
  startsAt: z.date().nullable().describe("Desired start"),
  endsAt: z.date().nullable().describe("Desired end"),
  quantity: z
    .number()
    .int()
    .nullable()
    .describe("Guaranteed or estimated headcount, else the requested quantity"),
  statusChangedAt: z.date().describe("When the order entered its status (time in status)"),
  assigneeId: z.string().nullable().describe("Main assignee (user id)"),
  following: z
    .boolean()
    .describe("The caller follows the order and is not its main assignee: drawn unfilled"),
  flags: z
    .array(MyWorkFlagSchema)
    .describe(
      "What blocks or needs fixing, blocks first: HARD_CLASH (another order's hard hold over a " +
        "soft hold still to come; needs program:read and item:read), HOLD_EXPIRES, QUOTE_WAITING " +
        "(quote:read) and UNREAD_MESSAGES (inbox:read)",
    ),
  nextTask: NextTaskSchema,
  heldLines: z
    .number()
    .int()
    .nullable()
    .describe("Lines in a soft-hold state (reserved, not blocking); null without program:read"),
  bookedLines: z
    .number()
    .int()
    .nullable()
    .describe("Lines in a hard-hold state (blocking their item); null without program:read"),
  estimatedValueMinor: z
    .number()
    .int()
    .nullable()
    .describe(
      "Estimated value excl. VAT in minor units of `currency`: the order's own estimate " +
        "(order.estimateHistory), else what its priced lines total (only with program:read)",
    ),
  confirmedValueMinor: z
    .number()
    .int()
    .nullable()
    .describe(
      "Agreed value excl. VAT in minor units of `currency`: the accepted quote's total; null " +
        "without an accepted quote or quote:read",
    ),
});

/** A task without an order on the board (ADR 0121), in the phase of its status. */
export const PipelineTaskCardSchema = z.object({
  kind: z.enum(["task"]).describe("A task card"),
  id: z.string().describe("Task id (task.get)"),
  columnId: z.string().describe("The board phase (column) the task shows in"),
  statusId: z.string().describe("The task's status id"),
  typeName: z.string().describe("The task type's name"),
  customerId: z
    .string()
    .nullable()
    .describe("The task's customer id (customer.get or customer.list); null = no customer"),
  dueAt: z.date().nullable().describe("When it is due; null = no due time"),
  overdue: z.boolean().describe("Past its due time"),
  assigneeId: z.string().nullable().describe("Main assignee (user id)"),
  allowedStatusIds: z
    .array(z.string())
    .describe(
      "The statuses it may move to now with task.move: they hold tasks, the move rule allows " +
        "the move and no gate a task meets blocks it. A drop on a column offers those of its " +
        "statuses that are listed here; none = the drop is refused",
    ),
});

export const PipelineBoardInputSchema = z.object({
  boardId: z.string().optional().describe("The board to show (board.list); default: the first"),
  assigneeId: z
    .string()
    .optional()
    .describe("Only orders and tasks this user is assigned to; replaces the board's own filter"),
  entityTypeId: z
    .string()
    .optional()
    .describe(
      "Only orders of this type, and no tasks (a task has no order type); replaces the " +
        "board's own filter",
    ),
  closedWithinDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .describe("Show orders in closing statuses that moved there within this many days"),
});

export const PipelineBoardSchema = z.object({
  boardId: z.string().nullable().describe("The board shown; null when the organization has none"),
  boardName: z.string().nullable(),
  columns: z.array(PipelineColumnSchema),
  cards: z.array(PipelineCardSchema),
  taskCards: z
    .array(PipelineTaskCardSchema)
    .describe(
      "Open tasks without an order in a status of the board (ADR 0121), by due time (none " +
        "last); shown after the orders of their phase. Empty without task:read or with an " +
        "order type filter",
    ),
  currency: z.string().describe("ISO 4217 code of the cards' values"),
  unmappedCount: z
    .number()
    .int()
    .describe(
      "Matching orders whose status is in no phase of this board, so not shown; tasks are " +
        "not counted",
    ),
});

export type PipelineStatus = z.infer<typeof PipelineStatusSchema>;
export type PipelineColumn = z.infer<typeof PipelineColumnSchema>;
export type PipelineCard = z.infer<typeof PipelineCardSchema>;
export type PipelineTaskCard = z.infer<typeof PipelineTaskCardSchema>;
export type PipelineBoard = z.infer<typeof PipelineBoardSchema>;
export type PipelineBoardInput = z.infer<typeof PipelineBoardInputSchema>;

export const PipelineCuesInputSchema = z.object({
  orderIds: z
    .array(z.string())
    .min(1)
    .max(100)
    .describe("The orders to read cues for, e.g. one page of order.list; unknown ids are left out"),
});

export const OrderCueSchema = z.object({
  orderId: z.string().describe("order.get"),
  soft: z
    .boolean()
    .nullable()
    .describe("Every held line is a soft hold (preliminary); null without program:read"),
  following: z.boolean().describe("The caller follows the order and is not its main assignee"),
  flags: z
    .array(MyWorkFlagSchema)
    .describe(
      "As on pipeline.board cards: HARD_CLASH, HOLD_EXPIRES, QUOTE_WAITING, UNREAD_MESSAGES",
    ),
  nextTask: NextTaskSchema,
});

export const PipelineCuesSchema = z.object({ cues: z.array(OrderCueSchema) });

export type PipelineCuesInput = z.infer<typeof PipelineCuesInputSchema>;
export type OrderCue = z.infer<typeof OrderCueSchema>;
export type PipelineCues = z.infer<typeof PipelineCuesSchema>;
