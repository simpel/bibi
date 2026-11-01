"use client";

import { Card } from "@bibi/ui";
import { ExportPreviewSummary } from "@/features/finance/ui/export-preview-summary";
import type { GenerativeProps } from "./generative-props";

export type AccountingExportPreviewViewProps = GenerativeProps<"accounting-export-preview">;

/** What the next SIE export would hold and what stops it. */
export function AccountingExportPreviewView({ preview }: AccountingExportPreviewViewProps) {
  const span =
    preview.firstDate && preview.lastDate ? `${preview.firstDate} – ${preview.lastDate}` : null;
  return (
    <Card data-slot="accounting-export-preview" className="p-4 shadow-none">
      <ExportPreviewSummary preview={preview} span={span} />
    </Card>
  );
}
