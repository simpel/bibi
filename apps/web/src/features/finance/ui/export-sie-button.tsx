"use client";

import type { AccountingExportPreviewDto } from "@bibi/core/schemas";
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
import { ExportPreviewSummary } from "./export-preview-summary";
import { useCreateExport } from "./use-create-export";

export type ExportSieButtonProps = { preview: AccountingExportPreviewDto; span: string | null };

/** "Export SIE" (`finance:write`): shows what is pending, then creates the export and saves the file. */
export function ExportSieButton({ preview, span }: ExportSieButtonProps) {
  const t = useTranslations("finance.export");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { confirm, pending } = useCreateExport({ onDone: () => setOpen(false) });
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <DownloadIcon />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <ExportPreviewSummary preview={preview} span={span} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {common("cancel")}
            </Button>
            <Button disabled={pending || preview.blockers.length > 0} onClick={confirm}>
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
