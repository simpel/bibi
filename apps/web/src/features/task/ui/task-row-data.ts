import type { TaskShape } from "@bibi/ui";

/** One task prepared on the server for `TaskRows`: texts formatted, links resolved. */
export type TaskRowData = {
  id: string;
  shape: TaskShape;
  timeLabel: string;
  title: string;
  /** One muted line, e.g. "Volvo Cars · Sara". */
  meta?: string | undefined;
  done: boolean;
  overdue: boolean;
};
