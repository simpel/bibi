"use client";

import { TaskRow } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { taskRoute } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { setTaskDoneAction } from "../actions";
import type { TaskRowData } from "./task-row-data";

export type TaskRowsProps = {
  tasks: readonly TaskRowData[];
  /** `task:write`: the checkboxes mark done and open again. */
  canEdit: boolean;
  size?: "default" | "compact";
};

/** Tasks as outlined rows (spec: tasks), checkbox first; checking one completes it at once. */
export function TaskRows({ tasks, canEdit, size }: TaskRowsProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const toggle = ({ id, done }: { id: string; done: boolean }) =>
    run({
      action: () => setTaskDoneAction({ id, done }),
      messages: { pending: common("saving"), success: t(done ? "completed" : "reopened") },
      onSuccess: () => router.refresh(),
    });
  return (
    <ul className="grid gap-1.5">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskRow
            shape={task.shape}
            timeLabel={task.timeLabel}
            title={task.title}
            meta={task.meta}
            checked={task.done}
            overdue={task.overdue}
            size={size}
            href={taskRoute({ id: task.id })}
            disabled={!canEdit || pending}
            checkboxLabel={t(task.done ? "reopen" : "complete", { name: task.title })}
            onCheckedChange={(done) => toggle({ id: task.id, done })}
          />
        </li>
      ))}
    </ul>
  );
}
