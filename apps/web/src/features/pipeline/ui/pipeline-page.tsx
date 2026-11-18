import type { Locale } from "@bibi/i18n";
import { AppCardLegend } from "@/components/card-legend/app-card-legend";
import { ErrorState } from "@/components/states/error-state";
import { PageTour } from "@/components/tour/page-tour";
import { BoardCustomizeView } from "@/features/board/ui/board-customize-view";
import { PipelineToolbar } from "@/features/board/ui/pipeline-toolbar";
import { UnmappedBanner } from "@/features/board/ui/unmapped-banner";
import { handleLoadError } from "@/server/load-error";
import { loadPipelineData } from "../load-pipeline-data";
import { BoardTotals } from "./board-totals";
import { PipelineBoardView } from "./pipeline-board-view";

export type PipelinePageProps = {
  locale: Locale;
  boardId?: string | undefined;
  /** `?mode=customize`; shown only to callers who may edit the view (ADR 0111). */
  customize: boolean;
};

/** `/pipeline`: the board switcher and the board, full height (ADR 0041, 0067). */
export async function PipelinePage({ locale, boardId, customize }: PipelinePageProps) {
  const data = await loadPipelineData({ boardId });
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const { board, boards, access } = data.value;
  if (customize && access.write && board.boardId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <BoardCustomizeView data={data.value} boardId={board.boardId} />
        <PageTour tour="board-customize" />
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <div data-tour="pipeline.toolbar">
        <PipelineToolbar
          boards={boards}
          boardId={board.boardId}
          access={access}
          members={data.value.members}
          totals={<BoardTotals board={board} />}
        />
      </div>
      {board.cards.length > 0 ? <AppCardLegend /> : null}
      {access.write && board.unmappedCount > 0 ? (
        <UnmappedBanner count={board.unmappedCount} boardId={board.boardId} />
      ) : null}
      <div data-tour="pipeline.board" className="min-h-0 flex-1">
        <PipelineBoardView
          board={board}
          transitions={data.value.transitions}
          moveGates={data.value.moveGates}
          customerNames={data.value.customerNames}
          memberNames={data.value.memberNames}
        />
      </div>
      <PageTour tour="pipeline" />
    </div>
  );
}
