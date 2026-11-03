import type { AccountingExportPreviewDto } from "@bibi/core/schemas";
import { useCallback, useRef, useState } from "react";
import { previewAccountingExportAction } from "../actions";
import { isValidPeriod, type Period } from "../lib/finance-period";

/**
 * The export dialog's range and what an export of it would hold, read when the dialog opens and
 * when the range changes; an answer for an older range is dropped.
 */
export function useExportPreview({ initial }: { initial: Period }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(initial);
  const [preview, setPreview] = useState<AccountingExportPreviewDto | null>(null);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const load = useCallback(({ range: next }: { range: Period }) => {
    if (!isValidPeriod(next)) return;
    const call = ++latest.current;
    setFailed(false);
    previewAccountingExportAction({ input: { from: next.from, to: next.to } })
      .then((result) => {
        if (call !== latest.current) return;
        setPreview(result.ok ? result.value : null);
        setFailed(!result.ok);
      })
      .catch(() => call === latest.current && setFailed(true));
  }, []);
  const openDialog = () => {
    setOpen(true);
    load({ range });
  };
  const changeRange = ({ range: next }: { range: Period }) => {
    setRange(next);
    load({ range: next });
  };
  const valid = isValidPeriod(range);
  return {
    ...{ open, setOpen, openDialog, range, changeRange },
    ...{ preview: valid ? preview : null, failed, valid },
  };
}
