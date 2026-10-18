import type { Locale } from "@okazi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { loadPipelineData } from "../load-pipeline-data";
import { PipelineBoardView } from "./pipeline-board-view";

export type PipelinePageProps = { locale: Locale };

/** `/pipeline`: only the board, full height (ADR 0041). */
export async function PipelinePage({ locale }: PipelinePageProps) {
  const data = await loadPipelineData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <div className="min-h-0 flex-1 p-3">
      <PipelineBoardView board={data.value.board} transitions={data.value.transitions} />
    </div>
  );
}
