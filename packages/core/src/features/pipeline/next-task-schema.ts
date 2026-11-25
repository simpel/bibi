import { z } from "zod";
import { TaskShapeSchema } from "../task/task-shape";

/** An order's next open task (ADR 0117): its earliest open, active linked task. */
export const NextTaskSchema = z
  .object({
    id: z.string().describe("task.get"),
    typeName: z.string(),
    shape: TaskShapeSchema,
    startsAt: z.date().describe("A meeting's start, or a deadline's due time"),
    endsAt: z.date().nullable().describe("A meeting's end; null for a deadline"),
    overdue: z.boolean().describe("Past its end or due time"),
  })
  .nullable()
  .describe("The order's earliest open task; null when none or without task:read");

export type NextTask = z.infer<typeof NextTaskSchema>;
