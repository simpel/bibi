"use client";

import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import { ArchiveIcon, CheckIcon, EllipsisIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { setTaskDoneAction } from "../actions";
import { ArchiveTaskDialog } from "./archive-task-dialog";

export type TaskHeaderActionsProps = {
  task: { id: string; name: string; done: boolean };
  /** `task:write`: Mark as done, or Mark as not done once it is. */
  canEdit: boolean;
  /** Unlinked and `order:write`: Create order from the task (spec: tasks, step 4). */
  canCreateOrder: boolean;
  /** `task:delete`. */
  canArchive: boolean;
};

/**
 * Create order while the task has none, Mark as done (or not done) like Follow, and Archive
 * task in the ⋯ menu.
 */
export function TaskHeaderActions({
  task,
  canEdit,
  canCreateOrder,
  canArchive,
}: TaskHeaderActionsProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const { run } = useToastAction();
  const toggleDone = () =>
    run({
      action: () => setTaskDoneAction({ id: task.id, done: !task.done }),
      messages: { pending: common("saving"), success: t(task.done ? "reopened" : "completed") },
      onSuccess: () => router.refresh(),
    });
  const actions: TitleRowAction[] = [
    ...(canCreateOrder
      ? [
          {
            id: "order",
            label: t("createOrder"),
            icon: <PlusIcon aria-hidden />,
            variant: "default" as const,
            onSelect: () =>
              router.push(`${ROUTES.orderNew}?fromTask=${encodeURIComponent(task.id)}`),
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            id: "done",
            label: t(task.done ? "markNotDone" : "markDone"),
            icon: task.done ? <RotateCcwIcon aria-hidden /> : <CheckIcon aria-hidden />,
            variant: "outline" as const,
            onSelect: toggleDone,
          },
        ]
      : []),
    ...(canArchive
      ? [
          {
            id: "more",
            label: common("actions"),
            icon: <EllipsisIcon aria-hidden />,
            variant: "outline" as const,
            overflow: true,
            items: [
              {
                id: "archive",
                label: t("archive"),
                icon: <ArchiveIcon aria-hidden />,
                onSelect: () => setArchiving(true),
              },
            ],
          },
        ]
      : []),
  ];
  if (actions.length === 0) return null;
  return (
    <>
      <HeaderActions actions={actions} moreLabel={common("actions")} foldBy="header" />
      {canArchive ? (
        <ArchiveTaskDialog task={task} open={archiving} onOpenChange={setArchiving} />
      ) : null}
    </>
  );
}
