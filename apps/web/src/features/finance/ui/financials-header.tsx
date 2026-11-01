import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { Period } from "../lib/finance-period";
import { ExportSieButton } from "./export-sie-button";

export type FinancialsHeaderProps = {
  /** Set with `finance:write`: shows "Export SIE", which starts on this period. */
  exportPeriod: Period | null;
};

/** Title with "Export SIE" (`finance:write`) and accounting settings as actions on the right. */
export function FinancialsHeader({ exportPeriod }: FinancialsHeaderProps) {
  const t = useTranslations("finance");
  return (
    <PageHeader
      title={t("title")}
      description={t("description")}
      actions={
        <>
          {exportPeriod ? <ExportSieButton period={exportPeriod} /> : null}
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.settingsAccounting}>{t("accountingSettings")}</Link>
          </Button>
        </>
      }
    />
  );
}
