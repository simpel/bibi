import type { PipelinePreview } from "@okazi/core/schemas";
import { MiniCalendar } from "./mini-calendar";
import { PreviewTable } from "./preview-table";
import { ProblemList } from "./problem-list";

export type PreviewPanelProps = { preview: PipelinePreview; tableId: string };

/** The preview of a pipeline setup: its problems, the holds over time and each line's state. */
export function PreviewPanel({ preview, tableId }: PreviewPanelProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      <ProblemList ready={preview.ready} problems={preview.problems} />
      <MiniCalendar steps={preview.steps} />
      <PreviewTable steps={preview.steps} tableId={tableId} />
    </div>
  );
}
