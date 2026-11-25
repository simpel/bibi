import type { TaskDto, TaskUpdateInput } from "@bibi/core";
import type { TaskFormOutput } from "./task-form-schema";

/** The parts of a task edited in place, each by the page element that shows it. */
export type TaskEditGroup = "when" | "contact" | "assignee" | "item" | "note";

const GROUP_KEYS = {
  when: ["entityTypeId", "startsAt", "endsAt"],
  contact: ["contactId"],
  assignee: ["assigneeId"],
  item: ["itemId"],
  note: ["note"],
} as const satisfies Record<
  TaskEditGroup,
  readonly (keyof TaskUpdateInput & keyof TaskFormOutput)[]
>;

export type ToTaskUpdateInput = {
  task: Pick<TaskDto, "id">;
  values: TaskFormOutput;
  groups: readonly TaskEditGroup[];
};

/** Create-shaped values → `task.update` input for the edited parts only. */
export function toTaskUpdate({ task, values, groups }: ToTaskUpdateInput): TaskUpdateInput {
  const input: TaskUpdateInput = { id: task.id };
  for (const group of groups) {
    for (const key of GROUP_KEYS[group]) Object.assign(input, { [key]: values[key] ?? null });
  }
  return input;
}
