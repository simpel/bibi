import type { KanbanPhaseData, KanbanStatusMove } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { actionWithToast } from "@/lib/action-with-toast";
import { useRouter } from "@/lib/navigation";
import { moveBoardPhaseStatusAction, reorderBoardPhasesAction } from "../actions";
import { moveInLayout, reorderLayout } from "../lib/customize-model";

type Override = { key: string; phases: KanbanPhaseData[] };

const layoutKey = ({ phases }: { phases: readonly KanbanPhaseData[] }) =>
  JSON.stringify(phases.map((phase) => [phase.id, phase.statusIds]));

type SaveInput<R> = {
  next: KanbanPhaseData[];
  action: () => Promise<ActionResult<R>>;
  success: string;
};

/** Shows `next` at once and saves it in the one-toast flow; a failure drops the override. */
function useLayoutSave({ key }: { key: string }) {
  const t = useTranslations("boardPhase");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [override, setOverride] = useState<Override | null>(null);
  const save = <R>({ next, action, success }: SaveInput<R>) => {
    setOverride({ key, phases: next });
    startTransition(async () => {
      const result = await actionWithToast({
        action,
        messages: { pending: t("saving"), success },
        translate: ({ key: errorKey }) => errors(errorKey),
      });
      if (result.ok) router.refresh();
      else setOverride(null);
    });
  };
  return { override: override?.key === key ? override.phases : null, save };
}

export type UseBoardLayoutInput = { boardId: string; phases: readonly KanbanPhaseData[] };

/**
 * The columns as shown in customize mode. A drop shows at once, saves with a toast, then the page
 * refreshes; the shown layout follows the saved board again as soon as it arrives, or at once
 * when saving fails.
 */
export function useBoardLayout({ boardId, phases }: UseBoardLayoutInput) {
  const t = useTranslations("boardPhase");
  const { override, save } = useLayoutSave({ key: layoutKey({ phases }) });
  const shown = override ?? phases;

  const reorder = ({ ids }: { ids: string[] }) =>
    save({
      next: reorderLayout({ phases: shown, ids }),
      action: () => reorderBoardPhasesAction({ boardId, ids }),
      success: t("reordered"),
    });

  const moveStatus = ({ statusId, toPhaseId }: Pick<KanbanStatusMove, "statusId" | "toPhaseId">) =>
    save({
      next: moveInLayout({ phases: shown, statusId, toPhaseId }),
      action: () =>
        moveBoardPhaseStatusAction({ input: { boardId, statusId, phaseId: toPhaseId } }),
      success: t("statusMoved"),
    });

  return { phases: shown, reorder, moveStatus };
}
