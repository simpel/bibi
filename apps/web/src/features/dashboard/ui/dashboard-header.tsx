import type { PlainDate } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/states/page-header";
import type { Period } from "@/features/finance/lib/finance-period";
import { PeriodRange } from "@/features/finance/ui/period-range";
import { type DashboardTab, tabBase } from "../lib/dashboard-tabs";

export type DashboardHeaderProps = {
  tab: DashboardTab;
  period: Period;
  today: PlainDate;
  customerId: string | undefined;
};

/** Title, preamble and the one range picker; no previous or next buttons (ADR 0086). */
export function DashboardHeader({ tab, period, today, customerId }: DashboardHeaderProps) {
  const t = useTranslations("dashboard");
  return (
    <PageHeader
      title={t("title")}
      description={t("description")}
      actions={
        <PeriodRange
          period={period}
          today={today}
          base={tabBase({ tab })}
          customerId={customerId}
        />
      }
    />
  );
}
