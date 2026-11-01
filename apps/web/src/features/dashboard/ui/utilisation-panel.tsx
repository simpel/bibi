import type { DashboardSummary, NumberFormat } from "@bibi/core/schemas";
import { RateBarChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { FinanceSection } from "@/features/finance/ui/finance-section";
import { utilisationRows } from "../lib/utilisation-rows";

export type UtilisationPanelProps = {
  utilisation: NonNullable<DashboardSummary["utilisation"]>;
  numbers: NumberFormat;
};

/** Booked over open hours per bookable item type for the period. */
export function UtilisationPanel({ utilisation, numbers }: UtilisationPanelProps) {
  const t = useTranslations("dashboard.utilisation");
  return (
    <FinanceSection title={t("title")} data={utilisation} emptyText={t("empty")}>
      <RateBarChart
        label={t("title")}
        categoryLabel={t("type")}
        rateLabel={t("rate")}
        rows={utilisationRows({
          utilisation,
          numbers,
          closed: t("closed"),
          text: (values) => t("text", values),
        })}
      />
    </FinanceSection>
  );
}
