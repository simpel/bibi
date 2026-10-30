import type { PipelineCard, PipelineStatus } from "@bibi/core";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { changeTicketStatusAction } from "@/features/ticket/actions";
import type { ActionError } from "@/lib/action-result";
import { errorKeyForCode } from "@/lib/error-key";
import { useRouter } from "@/lib/navigation";

export type RunMoveInput = { card: PipelineCard; to: PipelineStatus; reason?: string };
export type UseRunMoveInput = {
  /** A refused move with blockers to list. */
  onRefused: (input: { card: PipelineCard; to: PipelineStatus; error: ActionError }) => void;
  onMoved: () => void;
};

const STAY = { duration: Number.POSITIVE_INFINITY, closeButton: true } as const;

/** `ticket.changeStatus` for a drop in the one-toast flow; blockers go to `onRefused`. */
export function useRunMove({ onRefused, onMoved }: UseRunMoveInput) {
  const t = useTranslations("pipeline");
  const errors = useTranslations("errors");
  const router = useRouter();
  return async ({ card, to, reason }: RunMoveInput) => {
    const id = toast.loading(t("moving"));
    const input = { ticketId: card.id, statusId: to.id, ...(reason ? { reason } : {}) };
    try {
      const result = await changeTicketStatusAction({ input });
      if (result.ok) {
        toast.success(t("moved", { column: to.title }), { id });
        router.refresh();
        return onMoved();
      }
      if (result.error.issues.length > 0) {
        toast.dismiss(id);
        return onRefused({ card, to, error: result.error });
      }
      toast.error(errors(errorKeyForCode({ code: result.error.code })), { id, ...STAY });
    } catch {
      toast.error(errors("network"), { id, ...STAY });
    }
  };
}
