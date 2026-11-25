"use client";

import { Card } from "@bibi/ui";
import type { GenerativeProps } from "./generative-props";
import { TaskRowView } from "./task-row-view";

export type TaskCardViewProps = GenerativeProps<"task-card">;

/** One task (ADR 0117) as a row that opens its page. */
export function TaskCardView({ task }: TaskCardViewProps) {
  return (
    <Card data-slot="task-card" className="p-1 shadow-none">
      <TaskRowView task={task} />
    </Card>
  );
}
