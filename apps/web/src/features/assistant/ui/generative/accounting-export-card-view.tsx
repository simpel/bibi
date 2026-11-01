"use client";

import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type AccountingExportCardViewProps = GenerativeProps<"accounting-export-card">;

/** A created SIE export: number, vouchers and a link to the Financials page to download it. */
export function AccountingExportCardView({ accountingExport }: AccountingExportCardViewProps) {
  const t = useTranslations("finance.export");
  return (
    <Card data-slot="accounting-export-card" className="grid gap-1 p-4 text-sm shadow-none">
      <span className="font-medium">{t("exportNumber", { number: accountingExport.number })}</span>
      <span className="text-muted-foreground">{accountingExport.fileName}</span>
      <span>{t("vouchers", { count: accountingExport.voucherCount })}</span>
      <Link href={ROUTES.financials} className="font-medium hover:underline">
        {t("openToDownload")}
      </Link>
    </Card>
  );
}
