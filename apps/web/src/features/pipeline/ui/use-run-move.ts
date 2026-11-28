import type { PipelineStatus } from "@bibi/core";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { changeOrderStatusAction } from "@/features/order/actions";
import { moveTaskAction } from "@/features/task/actions";
import type { ActionError } from "@/lib/action-result";
import { errorKeyForCode } from "@/lib/error-key";
import { useRouter } from "@/lib/navigation";
import type { MoveSubject } from "../lib/move-rules";

export type RunMoveInput = { subject: MoveSubject; to: PipelineStatus; reason?: string };
export type UseRunMoveInput = {
  /** A refused move with blockers to list. */
  onRefused: (input: { subject: MoveSubject; to: PipelineStatus; error: ActionError }) => void;
  onMoved: () => void;
};

const STAY = { duration: Number.POSITIVE_INFINITY, closeButton: true } as const;

/** The command behind a drop: `order.changeStatus`, or `task.move` for a task card (ADR 0121). */
function runCommand({ subject, to, reason }: RunMoveInput) {
  if (subject.kind === "task") {
    return moveTaskAction({ input: { id: subject.card.id, statusId: to.id } });
  }
  const input = { orderId: subject.card.id, statusId: to.id, ...(reason ? { reason } : {}) };
  return changeOrderStatusAction({ input });
}

/** A drop in the one-toast flow; blockers go to `onRefused`. */
export function useRunMove({ onRefused, onMoved }: UseRunMoveInput) {
  const t = useTranslations("pipeline");
  const errors = useTranslations("errors");
  const router = useRouter();
  return async ({ subject, to, reason }: RunMoveInput) => {
    const id = toast.loading(t("moving"));
    try {
      const result = await runCommand({ subject, to, ...(reason ? { reason } : {}) });
      if (result.ok) {
        toast.success(t("moved", { column: to.title }), { id });
        router.refresh();
        return onMoved();
      }
      if (result.error.issues.length > 0) {
        toast.dismiss(id);
        return onRefused({ subject, to, error: result.error });
      }
      toast.error(errors(errorKeyForCode({ code: result.error.code })), { id, ...STAY });
    } catch {
      toast.error(errors("network"), { id, ...STAY });
    }
  };
}
