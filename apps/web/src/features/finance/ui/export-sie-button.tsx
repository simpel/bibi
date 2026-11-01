"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Period } from "../lib/finance-period";
import { RangeStatus } from "./export-range-status";
import { PeriodCalendar } from "./period-calendar";
import { useCreateExport } from "./use-create-export";
import { useExportPreview } from "./use-export-preview";

export type ExportSieButtonProps = { period: Period };

/**
 * "Export SIE" (`finance:write`): pick the range to report, see what it holds, then create the
 * export and save the file. The dialog stays usable, so the same range can be exported again.
 */
export function ExportSieButton({ period }: ExportSieButtonProps) {
  const t = useTranslations("finance.export");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(period);
  const { preview, failed, valid } = useExportPreview({ range, enabled: open });
  const { confirm, pending } = useCreateExport({ onDone: () => setOpen(false) });
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <DownloadIcon />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <PeriodCalendar draft={range} onChange={setRange} />
          <RangeStatus range={range} valid={valid} failed={failed} preview={preview} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {common("cancel")}
            </Button>
            <Button
              disabled={pending || !preview || preview.blockers.length > 0}
              onClick={() => confirm({ range })}
            >
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
