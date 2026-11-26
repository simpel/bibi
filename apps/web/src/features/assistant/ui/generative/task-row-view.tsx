"use client";

import type { TaskWire } from "@bibi/ai";
import { TaskRow } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { taskTimeLabel } from "@/features/task/lib/task-time-label";
import { taskRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

export type TaskRowViewProps = { task: TaskWire };

/** One task as the task lists show it: its due time, type, note and what to know about it. */
export function TaskRowView({ task }: TaskRowViewProps) {
  const t = useTranslations("assistant.ui.task");
  const dates = useDateTimeFormat();
  const done = task.doneAt !== null;
  const facts = [
    task.note,
    task.orderId ? t("linked") : null,
    task.status === "ARCHIVED" ? t("archived") : null,
  ].filter((fact): fact is string => Boolean(fact));
  return (
    <TaskRow
      timeLabel={
        task.dueAt ? taskTimeLabel({ task: { dueAt: task.dueAt }, dates }) : t("noDueTime")
      }
      title={task.type.name}
      meta={facts.length > 0 ? facts.join(" · ") : undefined}
      checked={done}
      overdue={task.overdue}
      disabled
      checkboxLabel={done ? t("done") : t("open")}
      href={task.status === "ARCHIVED" ? undefined : taskRoute({ id: task.id })}
    />
  );
}
