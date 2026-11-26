export type TaskState = "open" | "done" | "overdue";

/** The color of each state's status badge, in the table and on the task page. */
export const TASK_STATE_COLORS: Record<TaskState, string> = {
  open: "var(--task)",
  overdue: "var(--destructive)",
  done: "var(--success)",
};

/** One row of `/tasks`, prepared on the server (names resolved, times formatted). */
export type TaskListRow = {
  id: string;
  typeName: string;
  customerName: string;
  assigneeName: string;
  /** Assigned to the caller: `assignee:me` matches. */
  mine: boolean;
  state: TaskState;
  /** For sorting: the due time in ms; a task without one sorts last. */
  dueAtMs: number;
  /** The due time as text, or "No due time". */
  timeLabel: string;
  hasDueTime: boolean;
};
