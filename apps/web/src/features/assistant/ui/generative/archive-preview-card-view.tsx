"use client";

import { Card } from "@bibi/ui";
import { ArchivePreviewPanel } from "@/components/archive-preview/archive-preview-panel";
import type { GenerativeProps } from "./generative-props";

export type ArchivePreviewCardViewProps = GenerativeProps<"archive-preview-card">;

/** What archiving a status or state would do: the rows that move and the blockers. */
export function ArchivePreviewCardView({ preview, toolName }: ArchivePreviewCardViewProps) {
  const unit = toolName?.startsWith("itemState") ? "lines" : "tickets";
  return (
    <Card data-slot="archive-preview-card" className="p-4 shadow-none">
      <ArchivePreviewPanel preview={preview} unit={unit} />
    </Card>
  );
}
