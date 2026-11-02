"use client";

import { DataTableRowAction } from "@bibi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadBytes } from "@/lib/download-bytes";
import { useToastAction } from "@/lib/use-toast-action";
import { downloadAccountingExportAction } from "../actions";

export type DownloadExportMenuProps = { id: string };

/** Row action of the export history: saves the file of one export again. */
export function DownloadExportMenu({ id }: DownloadExportMenuProps) {
  const t = useTranslations("finance.export");
  const { run } = useToastAction();
  const download = () =>
    run({
      action: () => downloadAccountingExportAction({ id }),
      messages: { pending: t("downloading"), success: t("downloaded") },
      onSuccess: ({ value }) =>
        downloadBytes({
          base64: value.contentBase64,
          filename: value.filename,
          mimeType: value.mime,
        }),
    });
  return (
    <DataTableRowAction iconOnly label={t("download")} icon={DownloadIcon} onClick={download} />
  );
}
