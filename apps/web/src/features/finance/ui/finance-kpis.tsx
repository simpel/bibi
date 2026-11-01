import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { StatTile } from "@bibi/ui";
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
  const text = ({ minor }: { minor: number | null }) =>
    minor === null
      ? common("noAccessShort")
      : numbers.money({ minor, currency: overview.currency });
  return (
    <div data-slot="finance-kpis" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label={t("invoiced")}
        value={text({ minor: overview.invoicedExclVatMinor })}
        hint={t("exclVat")}
      />
      <StatTile
        label={t("received")}
        value={text({ minor: overview.receivedMinor })}
        hint={t("netOfRefunds")}
      />
      <StatTile
        label={t("outstanding")}
        value={text({ minor: overview.outstandingMinor })}
        hint={t("today")}
      />
      <StatTile
        label={t("overdue")}
        value={text({ minor: overview.overdueMinor })}
        hint={t("today")}
        tone={overview.overdueMinor ? "destructive" : "default"}
      />
    </div>
  );
}
