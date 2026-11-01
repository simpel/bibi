import type { AccountingExportPreviewDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { ExportSieButton } from "./export-sie-button";

export type FinancialsHeaderProps = {
  /** Set with `finance:write`: the "Export SIE" button and what it would export. */
  exportPreview: { preview: AccountingExportPreviewDto; span: string | null } | null;
};

/** Title with "Export SIE" (`finance:write`) and accounting settings as actions on the right. */
export function FinancialsHeader({ exportPreview }: FinancialsHeaderProps) {
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
        </>
      }
    />
  );
}
