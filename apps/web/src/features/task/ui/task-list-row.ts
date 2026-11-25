import type { TaskShape } from "@bibi/ui";

export type TaskState = "open" | "done" | "overdue";

/** One row of `/tasks`, prepared on the server (names resolved, times formatted). */
export type TaskListRow = {
  id: string;
  typeName: string;
  shape: TaskShape;
  customerName: string;
  assigneeName: string;
  /** Assigned to the caller: `assignee:me` matches. */
  mine: boolean;
  state: TaskState;
  /** For sorting: the start (or due time) in ms. */
  startsAtMs: number;
  timeLabel: string;
};
