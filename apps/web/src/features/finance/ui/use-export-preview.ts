import type { AccountingExportPreviewDto } from "@bibi/core/schemas";
import { useEffect, useState } from "react";
import { previewAccountingExportAction } from "../actions";
import { isValidPeriod, type Period } from "../lib/finance-period";

export type UseExportPreviewInput = { range: Period; enabled: boolean };

/** What an export of the range would hold; reloaded when the range changes while `enabled`. */
export function useExportPreview({ range, enabled }: UseExportPreviewInput) {
  const [preview, setPreview] = useState<AccountingExportPreviewDto | null>(null);
  const [failed, setFailed] = useState(false);
  const valid = isValidPeriod(range);
  const { from, to } = range;
  useEffect(() => {
    if (!enabled || !valid) return;
    let current = true;
    setFailed(false);
    previewAccountingExportAction({ input: { from, to } }).then((result) => {
      if (!current) return;
      setPreview(result.ok ? result.value : null);
      setFailed(!result.ok);
    });
    return () => {
      current = false;
    };
  }, [enabled, valid, from, to]);
  return { preview: valid ? preview : null, failed, valid };
}
