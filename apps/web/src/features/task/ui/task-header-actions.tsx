"use client";

import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import { ArchiveIcon, EllipsisIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { ArchiveTaskDialog } from "./archive-task-dialog";

export type TaskHeaderActionsProps = {
  task: { id: string; name: string };
  /** Unlinked and `order:write`: Create order from the task (spec: tasks, step 4). */
  canCreateOrder: boolean;
  /** `task:delete`. */
  canArchive: boolean;
};

/** Create order while the task has none, and Archive task in the ⋯ menu. */
export function TaskHeaderActions({ task, canCreateOrder, canArchive }: TaskHeaderActionsProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
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
