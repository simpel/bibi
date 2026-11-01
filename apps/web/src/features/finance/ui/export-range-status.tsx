import type { AccountingExportPreviewDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { MAX_PERIOD_MONTHS, type Period } from "../lib/finance-period";
import { ExportPreviewSummary } from "./export-preview-summary";

export type RangeStatusProps = {
  range: Period;
  valid: boolean;
  failed: boolean;
  preview: AccountingExportPreviewDto | null;
};

const spanOf = ({ preview }: { preview: AccountingExportPreviewDto }) =>
  preview.firstDate && preview.lastDate ? `${preview.firstDate} – ${preview.lastDate}` : null;

/** Under the range fields: why the range is not usable, or what an export of it would hold. */
export function RangeStatus({ range, valid, failed, preview }: RangeStatusProps) {
  const t = useTranslations("finance.export");
  const periodText = useTranslations("finance.period");
  if (range.from !== "" && range.to !== "" && !valid) {
    return (
      <p className="text-xs text-destructive">
        {periodText("invalid", { months: MAX_PERIOD_MONTHS })}
      </p>
    );
  }
  if (failed) return <p className="text-sm text-destructive">{t("previewFailed")}</p>;
  return preview ? <ExportPreviewSummary preview={preview} span={spanOf({ preview })} /> : null;
}
