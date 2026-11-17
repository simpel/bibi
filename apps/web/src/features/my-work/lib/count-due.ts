import type { MyWorkTaskGroup } from "@bibi/core/schemas";

/** The groups the sidebar's My work badge counts: what is due now (spec: home, Needs you). */
const DUE_GROUPS: ReadonlySet<MyWorkTaskGroup> = new Set(["BLOCKED", "LATE", "TODAY"]);

type CountDueInput = { tasks: readonly { group: MyWorkTaskGroup }[] | null };

/** Tasks that are blocked, late or due today; null when the member cannot read orders. */
export function countDue({ tasks }: CountDueInput): number | null {
  if (!tasks) return null;
  return tasks.filter((task) => DUE_GROUPS.has(task.group)).length;
}
