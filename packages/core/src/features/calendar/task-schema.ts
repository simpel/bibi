import { z } from "zod";

/**
 * A task on the calendar (ADR 0117, 0120): a point at its due time, drawn as an outline in its own
 * lane, never a block. Only tasks with a due time are on the calendar; a room it holds shows as
 * a block of its own (`blocks[].taskId`).
 */
export const CalendarTaskSchema = z.object({
  id: z.string().describe("task.get"),
  typeName: z.string(),
  dueAt: z.date().describe("When it is due"),
  itemIds: z
    .array(z.string())
    .describe("The rooms it concerns (item.get), related or held, in the task's order"),
  orderId: z.string().nullable().describe("The linked order; null when not linked"),
  customerId: z.string().nullable().describe("The customer; null when it has none"),
  done: z.boolean(),
  overdue: z.boolean().describe("Open and past its due time"),
});

export type CalendarTask = z.infer<typeof CalendarTaskSchema>;
