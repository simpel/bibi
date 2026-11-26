/** One task prepared on the server for `TaskRows`: texts formatted, links resolved. */
export type TaskRowData = {
  id: string;
  /** The due time as text; null = no due time. */
  timeLabel: string | null;
  title: string;
  /** One muted line, e.g. "Volvo Cars · Sara". */
  meta?: string | undefined;
  done: boolean;
  overdue: boolean;
};
