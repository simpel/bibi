import type { KanbanCustomizeLabels } from "@bibi/ui";
import { useTranslations } from "next-intl";

/** Customize mode's drag-and-drop texts (announcements, tray, empty column). */
export function useCustomizeLabels(): KanbanCustomizeLabels {
  const t = useTranslations("board.customize");
  return {
    dragInstructions: t("dragInstructions"),
    tray: t("tray"),
    trayEmpty: t("trayEmpty"),
    emptyPhase: t("emptyPhase"),
    phaseHandle: (phase) => t("phaseHandle", { phase }),
    count: (count) => t("count", { count }),
    pickedUp: (item) => t("pickedUp", { item }),
    movedOver: (item, target) => t("movedOver", { item, target }),
    dropped: (item, target) => t("dropped", { item, target }),
    cancelled: (item) => t("cancelled", { item }),
  };
}
