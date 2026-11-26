"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { cancelReservationAction, reservationStateAction, type StateAction } from "../actions";

/** Seat, undo, complete, no-show and cancel: one toast per action, then the page renders again. */
export function useReservationState({ onDone }: { onDone?: () => void } = {}) {
  const t = useTranslations("reservation.toast");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const done = () => {
    router.refresh();
    onDone?.();
  };
  const change = ({ id, action }: { id: string; action: StateAction }) =>
    run({
      action: () => reservationStateAction({ id, action }),
      messages: { pending: common("saving"), success: t(action) },
      onSuccess: done,
    });
  const cancel = ({ id }: { id: string }) =>
    run({
      action: () => cancelReservationAction({ id }),
      messages: { pending: common("saving"), success: t("cancel") },
      onSuccess: done,
    });
  return { change, cancel, pending };
}
