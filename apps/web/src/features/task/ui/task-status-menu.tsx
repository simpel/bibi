"use client";

import type { OrderStatusDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { StatusDropdown } from "@/components/status-dropdown";
import { OrderStatusLabel } from "@/features/order/ui/order-status-label";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { moveTaskAction } from "../actions";

export type TaskStatusMenuProps = {
  task: { id: string; statusId: string };
  statuses: readonly OrderStatusDto[];
  /** `task:write` on an open task: a menu; otherwise a plain label. */
  canEdit: boolean;
};

/** The statuses that hold tasks the current one allows moving to, in board order. */
const statusTargets = ({ task, statuses }: Pick<TaskStatusMenuProps, "task" | "statuses">) => {
  const current = statuses.find(({ id }) => id === task.statusId);
  const allowed = current ? new Set(current.transitionsTo) : null;
  return statuses.filter(
    ({ id, tasks }) => tasks && id !== task.statusId && (allowed === null || allowed.has(id)),
  );
};

/**
 * The status of a task without an order, like the order page's: a dropdown of the statuses that
 * hold tasks for writers (a refused move is the error toast), a status badge otherwise.
 */
export function TaskStatusMenu({ task, statuses, canEdit }: TaskStatusMenuProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const targets = statusTargets({ task, statuses });
  if (!canEdit || targets.length === 0) {
    return <OrderStatusLabel statuses={statuses} id={task.statusId} badge />;
  }
  return (
    <StatusDropdown
      current={<OrderStatusLabel statuses={statuses} id={task.statusId} />}
      label={t("changeStatus")}
      targets={targets}
      disabled={pending}
      onSelect={({ id: statusId }) =>
        run({
          action: () => moveTaskAction({ input: { id: task.id, statusId } }),
          messages: { pending: common("saving"), success: t("moved") },
          onSuccess: () => router.refresh(),
        })
      }
    />
  );
}
