import type { BookingStatusDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { reorderBookingStatusesAction } from "../actions";

type SwapInput = { ids: string[]; from: number; to: number };

const swap = ({ ids, from, to }: SwapInput) => {
  const next = [...ids];
  const [moving, other] = [next[from], next[to]];
  if (moving === undefined || other === undefined) return next;
  next[from] = other;
  next[to] = moving;
  return next;
};

export type UseMoveStatusInput = { statuses: readonly BookingStatusDto[]; index: number };

/** Moves a status one step within its phase (phases keep their lifecycle order). */
export function useMoveStatus({ statuses, index }: UseMoveStatusInput) {
  const t = useTranslations("bookingStatus");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const phase = statuses[index]?.phase;
  const canMove = ({ to }: { to: number }) => !pending && statuses[to]?.phase === phase;
  const move = ({ to }: { to: number }) =>
    run({
      action: () =>
        reorderBookingStatusesAction({
          ids: swap({ ids: statuses.map((status) => status.id), from: index, to }),
        }),
      messages: { pending: t("reordering"), success: t("reordered") },
      onSuccess: () => router.refresh(),
    });
  return { canMove, move };
}
