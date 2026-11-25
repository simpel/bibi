"use client";

import { TaskCheckbox } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setTaskDoneAction } from "../actions";

export type TaskDoneToggleProps = {
  task: { id: string; name: string; done: boolean };
  canEdit: boolean;
};

/** The task's round checkbox before its title: checking completes it, unchecking reopens it. */
export function TaskDoneToggle({ task, canEdit }: TaskDoneToggleProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  return (
    <TaskCheckbox
      checked={task.done}
      disabled={!canEdit || pending}
      label={t(task.done ? "reopen" : "complete", { name: task.name })}
      className="mt-0 size-6"
      onCheckedChange={(done) =>
        run({
          action: () => setTaskDoneAction({ id: task.id, done }),
          messages: { pending: common("saving"), success: t(done ? "completed" : "reopened") },
          onSuccess: () => router.refresh(),
        })
      }
    />
  );
}
