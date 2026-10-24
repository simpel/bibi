import type { TicketStatusDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { reorderTicketStatusesAction } from "../actions";

type SwapInput = { ids: string[]; from: number; to: number };

const swap = ({ ids, from, to }: SwapInput) => {
  const next = [...ids];
  const [moving, other] = [next[from], next[to]];
  if (moving === undefined || other === undefined) return next;
  next[from] = other;
  next[to] = moving;
  return next;
};

export type UseMoveStatusInput = { statuses: readonly TicketStatusDto[]; index: number };

/** Moves a status one step left or right on the board (`ticketStatus.reorder`). */
export function useMoveStatus({ statuses, index }: UseMoveStatusInput) {
  const t = useTranslations("ticketStatus");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const canMove = ({ to }: { to: number }) => !pending && statuses[to] !== undefined;
  const move = ({ to }: { to: number }) =>
    run({
      action: () =>
        reorderTicketStatusesAction({
          ids: swap({ ids: statuses.map((ticketStatus) => ticketStatus.id), from: index, to }),
        }),
      messages: { pending: t("reordering"), success: t("reordered") },
      onSuccess: () => router.refresh(),
    });
  return { canMove, move };
}
