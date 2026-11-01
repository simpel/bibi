import type { DashboardSummary, NumberFormat } from "@bibi/core/schemas";
import { ForwardBookedChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { bookedAheadRows } from "@/features/finance/lib/chart-data";
import { monthLabelOf } from "@/features/finance/lib/month-label";
import { FinanceSection } from "@/features/finance/ui/finance-section";

export type BookedAheadCardProps = {
  summary: Pick<DashboardSummary, "currency" | "bookedAhead">;
  numbers: NumberFormat;
};

/** Accepted quotes not yet invoiced, by event month (ADR 0080). */
export function BookedAheadCard({ summary, numbers }: BookedAheadCardProps) {
  const t = useTranslations("dashboard.bookedAhead");
  const finance = useTranslations("finance");
  const { bookedAhead, currency } = summary;
  return (
    <FinanceSection title={t("title")} data={bookedAhead}>
      <ForwardBookedChart
        label={t("title")}
        categoryLabel={finance("charts.month")}
        valueLabel={t("value")}
        months={bookedAheadRows({
          bookedAhead: bookedAhead ?? [],
          numbers,
          currency,
          monthLabel: monthLabelOf({ label: (values) => finance("monthLabel", values) }),
        })}
      />
    </FinanceSection>
  );
}
