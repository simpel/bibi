import { z } from "zod";

/** An order's next open task (ADR 0117, 0120): its earliest due, open, active linked task. */
export const NextTaskSchema = z
  .object({
    id: z.string().describe("task.get"),
    typeName: z.string(),
    dueAt: z.date().describe("When it is due"),
    overdue: z.boolean().describe("Past its due time"),
  })
  .nullable()
  .describe("The order's open task due first; null when none has a due time or without task:read");

export type NextTask = z.infer<typeof NextTaskSchema>;
