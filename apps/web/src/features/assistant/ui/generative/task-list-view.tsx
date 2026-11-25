"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { TaskRowView } from "./task-row-view";

export type TaskListViewProps = GenerativeProps<"task-list">;

/** A page of tasks by start, as the task lists show them. */
export function TaskListView({ items, nextCursor }: TaskListViewProps) {
  const t = useTranslations("assistant.ui.task");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="task-list" className="gap-0 p-1 shadow-none">
      <ul className="grid gap-0.5">
        {items.map((task) => (
          <li key={task.id}>
            <TaskRowView task={task} />
          </li>
        ))}
      </ul>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
