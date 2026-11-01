import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { type MoneyTotalItem, MoneyTotals } from "@bibi/ui";
import { useTranslations } from "next-intl";

type Overview = Pick<
  FinanceOverviewDto,
  "currency" | "invoicedExclVatMinor" | "receivedMinor" | "outstandingMinor" | "overdueMinor"
>;

export type FinanceKpisProps = { overview: Overview; numbers: NumberFormat };

type KpiItemsInput = {
  overview: Overview;
  t: (
    key: "invoiced" | "received" | "outstanding" | "overdue" | "exclVat" | "netOfRefunds" | "today",
  ) => string;
  fallback: string;
};

/** Received is secured money, outstanding still pending, overdue a problem once above zero. */
function kpiItems({ overview, t, fallback }: KpiItemsInput): MoneyTotalItem[] {
  const today = t("today");
  const items: MoneyTotalItem[] = [
    {
      key: "invoiced",
      label: t("invoiced"),
      minor: overview.invoicedExclVatMinor,
      hint: t("exclVat"),
    },
    {
      key: "received",
      label: t("received"),
      minor: overview.receivedMinor,
      hint: t("netOfRefunds"),
      tone: "positive",
    },
    {
      key: "outstanding",
      label: t("outstanding"),
      minor: overview.outstandingMinor,
      hint: today,
      tone: "pending",
    },
    {
      key: "overdue",
      label: t("overdue"),
      minor: overview.overdueMinor,
      hint: today,
      tone: overview.overdueMinor ? "negative" : "neutral",
    },
  ];
  return items.map((item) => ({ ...item, fallback }));
}

/** Invoiced, received, outstanding and overdue; "No access" where the caller may not read payments. */
export function FinanceKpis({ overview, numbers }: FinanceKpisProps) {
  const t = useTranslations("finance.kpi");
  const common = useTranslations("finance");
  return (
    <MoneyTotals
      data-slot="finance-kpis"
      size="lg"
      flow={numbers.moneyFlow({ currency: overview.currency })}
      items={kpiItems({ overview, t, fallback: common("noAccessShort") })}
    />
  );
}
