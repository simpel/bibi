import type { KanbanLabels } from "@okazi/ui";
import { useTranslations } from "next-intl";

/** The board's drag-and-drop texts (screen reader announcements and the empty lane). */
export function usePipelineLabels(): KanbanLabels {
  const t = useTranslations("pipeline.kanban");
  return {
    dragInstructions: t("dragInstructions"),
    emptyColumn: t("emptyColumn"),
    pickedUp: (card) => t("pickedUp", { card }),
    movedOver: (card, column) => t("movedOver", { card, column }),
    dropped: (card, column) => t("dropped", { card, column }),
    cancelled: (card) => t("cancelled", { card }),
  };
}
