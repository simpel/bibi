import { z } from "zod";

/** What a task type's tasks look like (ADR 0117). */
export const TASK_SHAPES = ["MEETING", "DEADLINE"] as const;

export const TaskShapeSchema = z
  .enum(TASK_SHAPES)
  .describe("MEETING: a start and an end (e.g. a site visit). DEADLINE: one due time, no end");

export type TaskShape = z.infer<typeof TaskShapeSchema>;
