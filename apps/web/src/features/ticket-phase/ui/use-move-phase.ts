import type { TicketPhaseDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { reorderTicketPhasesAction } from "../actions";

type SwapInput = { ids: string[]; from: number; to: number };

const swap = ({ ids, from, to }: SwapInput) => {
  const next = [...ids];
  const [moving, other] = [next[from], next[to]];
  if (moving === undefined || other === undefined) return next;
  next[from] = other;
  next[to] = moving;
  return next;
};

export type UseMovePhaseInput = { phases: readonly TicketPhaseDto[]; index: number };

/** Moves a phase one step left or right on the board (`ticketPhase.reorder`). */
export function useMovePhase({ phases, index }: UseMovePhaseInput) {
  const t = useTranslations("ticketPhase");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const canMove = ({ to }: { to: number }) => !pending && phases[to] !== undefined;
  const move = ({ to }: { to: number }) =>
    run({
      action: () =>
        reorderTicketPhasesAction({
          ids: swap({ ids: phases.map((phase) => phase.id), from: index, to }),
        }),
      messages: { pending: t("reordering"), success: t("reordered") },
      onSuccess: () => router.refresh(),
    });
  return { canMove, move };
}
