import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { MoneyTotals } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type FinanceKpisProps = {
  overview: Pick<
    FinanceOverviewDto,
    "currency" | "invoicedExclVatMinor" | "receivedMinor" | "outstandingMinor" | "overdueMinor"
  >;
  numbers: NumberFormat;
};

/** Invoiced, received, outstanding and overdue; "No access" where the caller may not read payments. */
export function FinanceKpis({ overview, numbers }: FinanceKpisProps) {
  const t = useTranslations("finance.kpi");
  const common = useTranslations("finance");
  const fallback = common("noAccessShort");
  return (
    <MoneyTotals
      data-slot="finance-kpis"
      size="lg"
      flow={numbers.moneyFlow({ currency: overview.currency })}
      items={[
        {
          key: "invoiced",
          label: t("invoiced"),
          minor: overview.invoicedExclVatMinor,
          fallback,
          hint: t("exclVat"),
        },
        {
          key: "received",
          label: t("received"),
          minor: overview.receivedMinor,
          fallback,
          hint: t("netOfRefunds"),
        },
        {
          key: "outstanding",
          label: t("outstanding"),
          minor: overview.outstandingMinor,
          fallback,
          hint: t("today"),
        },
        {
          key: "overdue",
          label: t("overdue"),
          minor: overview.overdueMinor,
          fallback,
          hint: t("today"),
          tone: overview.overdueMinor ? "destructive" : "default",
        },
      ]}
    />
  );
}
