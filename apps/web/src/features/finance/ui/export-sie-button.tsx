"use client";

import type { PlainDate } from "@bibi/core/schemas";
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
import type { Period } from "../lib/finance-period";
import { RangeStatus } from "./export-range-status";
import { FinancePeriodButton } from "./finance-period-button";
import { useCreateExport } from "./use-create-export";
import { useExportPreview } from "./use-export-preview";

export type ExportSieButtonProps = { period: Period; today: PlainDate };

/**
 * "Export SIE" (`finance:write`): pick the range to report, see what it holds, then create the
 * export and save the file. The dialog stays usable, so the same range can be exported again.
 */
export function ExportSieButton({ period, today }: ExportSieButtonProps) {
  const t = useTranslations("finance.export");
  const common = useTranslations("common");
  const { open, setOpen, openDialog, range, changeRange, preview, failed, valid } =
    useExportPreview({ initial: period });
  const { confirm, pending } = useCreateExport({ onDone: () => setOpen(false) });
  return (
    <>
      <Button size="sm" onClick={openDialog}>
        <DownloadIcon />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <FinancePeriodButton
            period={range}
            today={today}
            onChange={(next) => changeRange({ range: next })}
          />
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
