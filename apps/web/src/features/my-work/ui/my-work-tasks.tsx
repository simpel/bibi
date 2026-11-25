import type { DateTimeFormat, TaskDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { NamedOption } from "@/components/form/named-option";
import { toTaskRows } from "@/features/task/lib/to-task-rows";
import { TaskRows } from "@/features/task/ui/task-rows";

export type MyWorkTasksProps = {
  /** The member's tasks today, at least one. */
  tasks: readonly TaskDto[];
  customers: readonly NamedOption[];
  dates: DateTimeFormat;
  /** `task:write`: the checkboxes mark done. */
  canEdit: boolean;
};

/**
 * The member's tasks today at the top of Today (ADR 0117): outlined rows, checkbox first and time
 * first, never a card like the orders.
 */
export function MyWorkTasks({ tasks, customers, dates, canEdit }: MyWorkTasksProps) {
  const t = useTranslations("task.myWork");
  const rows = toTaskRows({ tasks, dates, customers, withDay: false });
  return (
    <div data-slot="my-work-tasks" className="grid gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{t("title")}</h3>
      <TaskRows tasks={rows} canEdit={canEdit} size="compact" />
    </div>
  );
}
