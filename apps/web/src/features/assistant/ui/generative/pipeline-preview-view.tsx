"use client";

import { Card } from "@okazi/ui";
import { PreviewPanel } from "@/features/pipeline-setup/ui/preview-panel";
import type { GenerativeProps } from "./generative-props";

export type PipelinePreviewViewProps = GenerativeProps<"pipeline-preview">;

/** A proposed pipeline setup (ADR 0044): its problems and the simulated ticket. */
export function PipelinePreviewView({ preview }: PipelinePreviewViewProps) {
  return (
    <Card data-slot="pipeline-preview" className="p-4 shadow-none">
      <PreviewPanel preview={preview} tableId="pipeline-setup.preview.assistant" />
    </Card>
  );
}
