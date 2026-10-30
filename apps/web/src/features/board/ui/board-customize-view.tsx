"use client";

import { KanbanCustomizeBoard } from "@bibi/ui";
import { kanbanCards } from "@/features/pipeline/lib/kanban-model";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import type { PipelineData } from "@/features/pipeline/load-pipeline-data";
import { useRouter } from "@/lib/navigation";
import { customizeChips, customizePhases } from "../lib/customize-model";
import { BoardCustomizeToolbar } from "./board-customize-toolbar";
import { customizeSlots } from "./customize-slots";
import { useBoardLayout } from "./use-board-layout";
import { useCustomizeLabels } from "./use-customize-labels";
import { useFlipIn } from "./use-flip-in";

export type BoardCustomizeViewProps = { data: PipelineData; boardId: string };

/**
 * `/pipeline?mode=customize` (ADR 0067): every column turns over to its settings. Columns are
 * dragged into order, statuses between columns and the unphased column on the far left; each
 * change saves at once. Done turns the columns back and leaves customize mode once they have.
 */
export function BoardCustomizeView({ data, boardId }: BoardCustomizeViewProps) {
  const router = useRouter();
  const { board, boards, statuses, access } = data;
  const layout = useBoardLayout({ boardId, phases: customizePhases({ board }) });
  const flip = useFlipIn();
  const labels = useCustomizeLabels();
  const cards = kanbanCards({ board, customerNames: data.customerNames });
  const isDefault = boards[0]?.id === boardId;
  const done = () =>
    flip.flipOut({
      onFlipped: () => router.push(pipelineHref({ boardId: isDefault ? null : boardId })),
    });
  return (
    <>
      <BoardCustomizeToolbar boards={boards} boardId={boardId} access={access} onDone={done} />
      <div className="min-h-0 flex-1">
        <KanbanCustomizeBoard
          phases={layout.phases}
          statuses={customizeChips({ board, statuses })}
          flipped={flip.flipped}
          labels={labels}
          slots={customizeSlots({
            ...{ boardId, statuses, cards, access },
            phases: layout.phases,
            onReorder: layout.reorder,
            onMove: layout.moveStatus,
          })}
          onReorderPhases={layout.reorder}
          onMoveStatus={layout.moveStatus}
          onFlipEnd={flip.onFlipEnd}
        />
      </div>
    </>
  );
}
