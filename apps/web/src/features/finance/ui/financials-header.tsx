import type { AccountingExportPreviewDto, PlainDate } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { Period } from "../lib/finance-period";
import { ExportSieButton } from "./export-sie-button";
import { PeriodSwitcher } from "./period-switcher";

export type FinancialsHeaderProps = {
  period: Period;
  today: PlainDate;
  /** Set with `finance:write`: the "Export SIE" button and what it would export. */
  exportPreview: { preview: AccountingExportPreviewDto; span: string | null } | null;
};

/** Title, "Export SIE" (`finance:write`), accounting settings and the period switcher. */
export function FinancialsHeader({ period, today, exportPreview }: FinancialsHeaderProps) {
  const t = useTranslations("finance");
  return (
    <PageHeader
      title={t("title")}
      description={t("description")}
      actions={
        <>
          {exportPreview ? <ExportSieButton {...exportPreview} /> : null}
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.settingsAccounting}>{t("accountingSettings")}</Link>
          </Button>
          <PeriodSwitcher period={period} today={today} />
        </>
      }
    />
  );
}
