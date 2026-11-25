"use client";

import { HeaderActions, type TitleRowAction } from "@bibi/ui";
import {
  ArchiveIcon,
  CheckIcon,
  EllipsisIcon,
  ListPlusIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { setTaskDoneAction } from "../actions";
import { ArchiveTaskDialog } from "./archive-task-dialog";
import { TaskLinkOrderDialog } from "./task-link-order";

export type TaskHeaderActionsProps = {
  task: { id: string; name: string; done: boolean };
  /** `task:write`: Mark as done, or Mark as not done once it is. */
  canEdit: boolean;
  /** Unlinked and `task:write`: Add to order, the primary action (`task.linkOrder`). */
  canLinkOrder: boolean;
  /** The customer's orders the dialog offers; started by the page, unwrapped on open. */
  linkableOrders: Promise<readonly NamedOption[]>;
  /** Unlinked and `order:write`: Create order from the task, in the ⋯ menu (spec: tasks, step 4). */
  canCreateOrder: boolean;
  /** `task:delete`. */
  canArchive: boolean;
};

/**
 * While the task has no order: Add to order first, Create order in the ⋯ menu. Then Mark as
 * done (or not done) like Follow, and Archive task in the ⋯ menu.
 */
export function TaskHeaderActions({
  task,
  canEdit,
  canLinkOrder,
  linkableOrders,
  canCreateOrder,
  canArchive,
}: TaskHeaderActionsProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const [linking, setLinking] = useState(false);
  const { run } = useToastAction();
  const toggleDone = () =>
    run({
      action: () => setTaskDoneAction({ id: task.id, done: !task.done }),
      messages: { pending: common("saving"), success: t(task.done ? "reopened" : "completed") },
      onSuccess: () => router.refresh(),
    });
  const createOrder = () =>
    router.push(`${ROUTES.orderNew}?fromTask=${encodeURIComponent(task.id)}`);
  const more: TitleRowAction["items"] = [
    ...(canCreateOrder
      ? [
          {
            id: "order",
            label: t("createOrder"),
            icon: <PlusIcon aria-hidden />,
            onSelect: createOrder,
          },
        ]
      : []),
    ...(canArchive
      ? [
          {
            id: "archive",
            label: t("archive"),
            icon: <ArchiveIcon aria-hidden />,
            onSelect: () => setArchiving(true),
          },
        ]
      : []),
  ];
  const actions: TitleRowAction[] = [
    ...(canLinkOrder
      ? [
          {
            id: "link",
            label: t("addToOrder"),
            icon: <ListPlusIcon aria-hidden />,
            variant: "default" as const,
            onSelect: () => setLinking(true),
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
    ...(more.length > 0
      ? [
          {
            id: "more",
            label: common("actions"),
            icon: <EllipsisIcon aria-hidden />,
            variant: "outline" as const,
            overflow: true,
            items: more,
          },
        ]
      : []),
  ];
  if (actions.length === 0) return null;
  return (
    <>
      <HeaderActions actions={actions} moreLabel={common("actions")} foldBy="header" />
      {canLinkOrder ? (
        <TaskLinkOrderDialog
          taskId={task.id}
          orders={linkableOrders}
          open={linking}
          onOpenChange={setLinking}
        />
      ) : null}
      {canArchive ? (
        <ArchiveTaskDialog task={task} open={archiving} onOpenChange={setArchiving} />
      ) : null}
    </>
  );
}
