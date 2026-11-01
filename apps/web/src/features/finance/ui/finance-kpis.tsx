import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { type MoneyTotalItem, MoneyTotals } from "@bibi/ui";
import { useTranslations } from "next-intl";

type Overview = Pick<
  FinanceOverviewDto,
  "currency" | "invoicedExclVatMinor" | "receivedMinor" | "outstandingMinor" | "overdueMinor"
>;

/** `period` = invoiced and received in the period; `open` = outstanding and overdue today. */
export type FinanceKpiPart = "period" | "open";

export type FinanceKpisProps = {
  overview: Overview;
  numbers: NumberFormat;
  /** Left out: all four, e.g. in the assistant's card. */
  part?: FinanceKpiPart;
};

const PART_KEYS: Record<FinanceKpiPart, readonly string[]> = {
  period: ["invoiced", "received"],
  open: ["outstanding", "overdue"],
};

type KpiItemsInput = {
  overview: Overview;
  t: (
    key: "invoiced" | "received" | "outstanding" | "overdue" | "exclVat" | "netOfRefunds",
  ) => string;
  fallback: string;
};

/** Received is secured money, outstanding still pending, overdue a problem once above zero. */
function kpiItems({ overview, t, fallback }: KpiItemsInput): MoneyTotalItem[] {
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
      tone: "pending",
    },
    {
      key: "overdue",
      label: t("overdue"),
      minor: overview.overdueMinor,
      tone: overview.overdueMinor ? "negative" : "neutral",
    },
  ];
  return items.map((item) => ({ ...item, fallback }));
}

/**
 * One half of the headline figures: invoiced and received in the period, or outstanding and
 * overdue today; "No access" where the caller may not read payments.
 */
export function FinanceKpis({ overview, numbers, part }: FinanceKpisProps) {
  const t = useTranslations("finance.kpi");
  const common = useTranslations("finance");
  return (
    <MoneyTotals
      data-slot="finance-kpis"
      memoryKey={`finance-kpis-${part ?? "all"}`}
      size="lg"
      flow={numbers.moneyFlow({ currency: overview.currency })}
      items={kpiItems({ overview, t, fallback: common("noAccessShort") }).filter(
        ({ key }) => !part || PART_KEYS[part].includes(key),
      )}
    />
  );
}
