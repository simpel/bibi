import { KanbanColumnFace, type KanbanPhaseData } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { BoardCard } from "@/features/pipeline/lib/kanban-model";
import { PipelineCardContent } from "@/features/pipeline/ui/pipeline-card";

export type PhaseFrontProps = { phase: KanbanPhaseData; cards: readonly BoardCard[] };

/** A column's front in customize mode: the board as it was, before the column turns over. */
export function PhaseFront({ phase, cards }: PhaseFrontProps) {
  const t = useTranslations("pipeline.kanban");
  const inPhase = cards.filter((card) => card.columnId === phase.id);
  return (
    <KanbanColumnFace column={phase} count={inPhase.length} emptyLabel={t("emptyColumn")}>
      {inPhase.map((card) => (
        <div key={card.id} className="rounded-lg border bg-card p-3 shadow-xs">
          <PipelineCardContent card={card} />
        </div>
      ))}
    </KanbanColumnFace>
  );
}
