import type { FinanceAging, NumberFormat } from "@bibi/core/schemas";
import { AgingChart } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { agingRows, agingWithMoney } from "../lib/chart-data";
import { FinanceSection } from "./finance-section";

export type AgingCardProps = {
  aging: FinanceAging | null;
  numbers: NumberFormat;
  currency: string;
};

/** Open invoice money by age; "no access" when `aging` is null, "no data" when nothing is open. */
export function AgingCard({ aging, numbers, currency }: AgingCardProps) {
  const t = useTranslations("finance");
  return (
    <FinanceSection title={t("charts.aging.title")} data={agingWithMoney({ aging })}>
      {aging ? (
        <AgingChart
          label={t("charts.aging.title")}
          categoryLabel={t("charts.aging.bucket")}
          amountLabel={t("charts.aging.open")}
          buckets={agingRows({
            aging,
            numbers,
            currency,
            labels: {
              notDue: t("charts.aging.notDue"),
              overdue1to30: t("charts.aging.overdue1to30"),
              overdue31to60: t("charts.aging.overdue31to60"),
              overdue61Plus: t("charts.aging.overdue61Plus"),
            },
          })}
        />
      ) : null}
    </FinanceSection>
  );
}
