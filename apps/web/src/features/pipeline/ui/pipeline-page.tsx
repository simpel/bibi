import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { BoardCustomizeView } from "@/features/board/ui/board-customize-view";
import { PipelineToolbar } from "@/features/board/ui/pipeline-toolbar";
import { UnmappedBanner } from "@/features/board/ui/unmapped-banner";
import { handleLoadError } from "@/server/load-error";
import { loadPipelineData } from "../load-pipeline-data";
import { PipelineBoardView } from "./pipeline-board-view";

export type PipelinePageProps = {
  locale: Locale;
  boardId?: string | undefined;
  /** `?mode=customize`; shown only to callers with `pipeline:write`. */
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
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <PipelineToolbar boards={boards} boardId={board.boardId} canConfigure={access.write} />
      {access.write && board.unmappedCount > 0 ? (
        <UnmappedBanner count={board.unmappedCount} boardId={board.boardId} />
      ) : null}
      <div className="min-h-0 flex-1">
        <PipelineBoardView
          board={board}
          transitions={data.value.transitions}
          reasonMoves={data.value.reasonMoves}
          customerNames={data.value.customerNames}
        />
      </div>
    </div>
  );
}
