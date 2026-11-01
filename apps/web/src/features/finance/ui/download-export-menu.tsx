"use client";

import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { downloadBytes } from "@/lib/download-bytes";
import { useToastAction } from "@/lib/use-toast-action";
import { downloadAccountingExportAction } from "../actions";

export type DownloadExportMenuProps = { id: string };

/** Row action of the export history: saves the file of one export again. */
export function DownloadExportMenu({ id }: DownloadExportMenuProps) {
  const t = useTranslations("finance.export");
  const common = useTranslations("common");
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
    <DataTableRowActions label={common("actions")}>
      <DropdownMenuItem onSelect={download}>{t("download")}</DropdownMenuItem>
    </DataTableRowActions>
  );
}
