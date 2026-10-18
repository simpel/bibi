import type { ItemStateDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { reorderItemStatesAction } from "../actions";

type SwapInput = { ids: string[]; from: number; to: number };

const swap = ({ ids, from, to }: SwapInput) => {
  const next = [...ids];
  const [moving, other] = [next[from], next[to]];
  if (moving === undefined || other === undefined) return next;
  next[from] = other;
  next[to] = moving;
  return next;
};

export type UseMoveStateInput = { states: readonly ItemStateDto[]; index: number };

/** Moves a state one step up or down in its type's order (`itemState.reorder`). */
export function useMoveState({ states, index }: UseMoveStateInput) {
  const t = useTranslations("itemState");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const canMove = ({ to }: { to: number }) => !pending && states[to] !== undefined;
  const move = ({ to }: { to: number }) =>
    run({
      action: () =>
        reorderItemStatesAction({
          entityTypeId: states[index]?.entityTypeId ?? "",
          ids: swap({ ids: states.map((state) => state.id), from: index, to }),
        }),
      messages: { pending: t("reordering"), success: t("reordered") },
      onSuccess: () => router.refresh(),
    });
  return { canMove, move };
}
