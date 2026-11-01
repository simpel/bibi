"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type AccountingExportFileViewProps = GenerativeProps<"accounting-export-file">;

/** The downloaded file's name and size; its bytes are never shown. */
export function AccountingExportFileView({ file }: AccountingExportFileViewProps) {
  const t = useTranslations("finance.export");
  return (
    <Card data-slot="accounting-export-file" className="grid gap-1 p-4 text-sm shadow-none">
      <span className="font-medium">{file.filename}</span>
      <span className="text-muted-foreground">{t("fileSize", { bytes: file.size })}</span>
      <Link href={ROUTES.financials} className="font-medium hover:underline">
        {t("openToDownload")}
      </Link>
    </Card>
  );
}
