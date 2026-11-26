import type { DateTimeFormat, TaskDto } from "@bibi/core/schemas";
import { type NamedOption, nameOf } from "@/components/form/named-option";
import type { TaskRowData } from "../ui/task-row-data";
import { taskTimeLabel } from "./task-time-label";

export type ToTaskRowsInput = {
  tasks: readonly TaskDto[];
  dates: DateTimeFormat;
  /** Names for the meta line; a list left out is not shown (e.g. the customer on its own page). */
  customers?: readonly NamedOption[] | undefined;
  members?: readonly NamedOption[] | undefined;
  /** Today's list: the time alone. */
  withDay?: boolean;
};

/** By due time, a task without one last. */
const byDue = ({ a, b }: { a: TaskDto; b: TaskDto }) => {
  const [x, y] = [a, b].map((task) => task.dueAt?.getTime() ?? Number.POSITIVE_INFINITY);
  return x === y ? 0 : (x ?? 0) < (y ?? 0) ? -1 : 1;
};

/** Tasks as `TaskRows` show them: time first, the type as title, customer and assignee after. */
export function toTaskRows({
  tasks,
  dates,
  customers,
  members,
  withDay = true,
}: ToTaskRowsInput): TaskRowData[] {
  // Open tasks first, each by due time (none last); done ones after.
  const sorted = [...tasks].sort(
    (a, b) => Number(a.doneAt !== null) - Number(b.doneAt !== null) || byDue({ a, b }),
  );
  return sorted.map((task) => {
    const meta = [
      customers && task.customerId ? nameOf({ options: customers, id: task.customerId }) : null,
      members && task.assigneeId ? nameOf({ options: members, id: task.assigneeId }) : null,
    ].filter((part): part is string => Boolean(part) && part !== "–");
    return {
      id: task.id,
      timeLabel: task.dueAt ? taskTimeLabel({ task: { dueAt: task.dueAt }, dates, withDay }) : null,
      title: task.type.name,
      meta: meta.length > 0 ? meta.join(" · ") : undefined,
      done: task.doneAt !== null,
      overdue: task.overdue,
    };
  });
}
