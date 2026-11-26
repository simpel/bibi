import { z } from "zod";

/** How a task uses a room (ADR 0120). */
export const TASK_ITEM_HOLDS = ["RELATED", "PREBOOK", "BOOK"] as const;

export const TaskItemHoldSchema = z
  .enum(TASK_ITEM_HOLDS)
  .describe(
    "RELATED: only names the room, no window. PREBOOK: sets it aside as a soft hold (may " +
      "overlap). BOOK: blocks it as a hard hold (a collision is CONFLICT)",
  );

/** A room on a task as the API returns it. */
export const TaskItemSchema = z.object({
  id: z.string(),
  itemId: z.string().describe("The room (item.get); an item of a BOOKABLE type"),
  hold: TaskItemHoldSchema,
  startsAt: z
    .date()
    .nullable()
    .describe("Start of a prebook's or book's own window; null when RELATED"),
  endsAt: z.date().nullable().describe("End of the window (exclusive); null when RELATED"),
});

/** A room as `task.create` and `task.update` take it; a task takes no quantities. */
export const TaskItemInputSchema = z.object({
  itemId: z.string().min(1).describe("An active item of a BOOKABLE type (item.list)"),
  hold: TaskItemHoldSchema,
  startsAt: z.coerce
    .date()
    .nullish()
    .describe("PREBOOK and BOOK: required, before endsAt, independent of dueAt; RELATED: omit"),
  endsAt: z.coerce
    .date()
    .nullish()
    .describe("PREBOOK and BOOK: required, after startsAt (exclusive); RELATED: omit"),
});

export const TaskItemsInputSchema = z
  .array(TaskItemInputSchema)
  .max(20)
  .describe(
    "The rooms the task concerns (ADR 0120), each once. A prebook or book holds the room for " +
      "its own window while the task is open; marking the task done or archiving it releases " +
      "it. Needs item:read",
  );

export type TaskItemHold = z.infer<typeof TaskItemHoldSchema>;
export type TaskItemDto = z.infer<typeof TaskItemSchema>;
export type TaskItemInput = z.infer<typeof TaskItemInputSchema>;
