"use client";

import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { CheckIcon, EllipsisIcon, ListPlusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { Link, useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { setTaskDoneAction } from "../actions";
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
};

/**
 * Mark as done (with its label, first), then Add to order joined to a ⋯ menu with Create order,
 * like the top bar's Create order. Archiving lives in the page's danger area.
 */
export function TaskHeaderActions(props: TaskHeaderActionsProps) {
  const { task, canEdit, canLinkOrder, linkableOrders, canCreateOrder } = props;
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const [linking, setLinking] = useState(false);
  const { run, pending } = useToastAction();
  const toggleDone = () =>
    run({
      action: () => setTaskDoneAction({ id: task.id, done: !task.done }),
      messages: { pending: common("saving"), success: t(task.done ? "reopened" : "completed") },
      onSuccess: () => router.refresh(),
    });
  const hasMenu = canCreateOrder;
  return (
    <div className="flex items-center gap-2">
      {canEdit ? (
        <Button variant="outline" onClick={toggleDone} pending={pending} aria-pressed={task.done}>
          {task.done ? <RotateCcwIcon aria-hidden /> : <CheckIcon aria-hidden />}
          {t(task.done ? "markNotDone" : "markDone")}
        </Button>
      ) : null}
      <ButtonGroup>
        {canLinkOrder ? (
          <Button onClick={() => setLinking(true)}>
            <ListPlusIcon aria-hidden />
            {t("addToOrder")}
          </Button>
        ) : null}
        {canLinkOrder && hasMenu ? (
          <ButtonGroupSeparator className="bg-primary-foreground/40" />
        ) : null}
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={canLinkOrder ? "default" : "outline"}
                size="icon"
                aria-label={common("actions")}
              >
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canCreateOrder ? (
                <DropdownMenuItem asChild>
                  <Link href={`${ROUTES.orderNew}?fromTask=${encodeURIComponent(task.id)}`}>
                    <PlusIcon aria-hidden />
                    {t("createOrder")}
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </ButtonGroup>
      {canLinkOrder ? (
        <TaskLinkOrderDialog
          taskId={task.id}
          orders={linkableOrders}
          open={linking}
          onOpenChange={setLinking}
        />
      ) : null}
    </div>
  );
}
