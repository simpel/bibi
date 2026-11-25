import type { DateTimeFormat, TaskDto } from "@bibi/core/schemas";
import { type NamedOption, nameOf } from "@/components/form/named-option";
import type { TaskRowData } from "../ui/task-row-data";
import { taskTimeLabel, uiTaskShape } from "./task-time-label";

export type ToTaskRowsInput = {
  tasks: readonly TaskDto[];
  dates: DateTimeFormat;
  /** Names for the meta line; a list left out is not shown (e.g. the customer on its own page). */
  customers?: readonly NamedOption[] | undefined;
  members?: readonly NamedOption[] | undefined;
  /** Today's list: the time alone. */
  withDay?: boolean;
};

/** Tasks as `TaskRows` show them: time first, the type as title, customer and assignee after. */
export function toTaskRows({
  tasks,
  dates,
  customers,
  members,
  withDay = true,
}: ToTaskRowsInput): TaskRowData[] {
  // Open tasks first, each by time; done ones after.
  const sorted = [...tasks].sort(
    (a, b) =>
      Number(a.doneAt !== null) - Number(b.doneAt !== null) ||
      a.startsAt.getTime() - b.startsAt.getTime(),
  );
  return sorted.map((task) => {
    const meta = [
      customers ? nameOf({ options: customers, id: task.customerId }) : null,
      members && task.assigneeId ? nameOf({ options: members, id: task.assigneeId }) : null,
    ].filter((part): part is string => Boolean(part) && part !== "–");
    return {
      id: task.id,
      shape: uiTaskShape({ shape: task.shape }),
      timeLabel: taskTimeLabel({ task, dates, withDay }),
      title: task.type.name,
      meta: meta.length > 0 ? meta.join(" · ") : undefined,
      done: task.doneAt !== null,
      overdue: task.overdue,
    };
  });
}
