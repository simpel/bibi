import { z } from "zod";
import { TaskShapeSchema } from "../task/task-shape";

/** A task on the calendar (ADR 0117): drawn as an outline in its own lane, never a block. */
export const CalendarTaskSchema = z.object({
  id: z.string().describe("task.get"),
  typeName: z.string(),
  shape: TaskShapeSchema,
  startsAt: z.date().describe("A meeting's start, or a deadline's due time"),
  endsAt: z.date().nullable().describe("A meeting's end; null for a deadline"),
  itemId: z.string().nullable().describe("The item it names, e.g. the room to show"),
  orderId: z.string().nullable().describe("The linked order; null when not linked"),
  customerId: z.string(),
  done: z.boolean(),
  overdue: z.boolean().describe("Open and past its end or due time"),
});

export type CalendarTask = z.infer<typeof CalendarTaskSchema>;
