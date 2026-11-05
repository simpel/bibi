"use client";

import type { PlainDate } from "@bibi/core/schemas";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/states/page-header";
import { isValidPeriod } from "@/features/finance/lib/finance-period";
import { PeriodRange } from "@/features/finance/ui/period-range";
import { presetPeriod } from "@/lib/time/period-presets";
import { type DashboardKey, dashboardBase, dashboardOf } from "../lib/dashboards";
import { DashboardsNav } from "./dashboards-nav";

export type DashboardsHeaderProps = {
  today: PlainDate;
  dashboards: readonly DashboardKey[];
};

type Params = { dashboard?: string; from?: string; to?: string };

/**
 * Title, preamble, the range picker and the dashboards as tabs (ADR 0086). It lives in the
 * layout and reads the dashboard and range from the URL, so it stays put while only the content
 * below changes when a tab or the range changes.
 */
export function DashboardsHeader({ today, dashboards }: DashboardsHeaderProps) {
  const t = useTranslations("dashboard");
  const params = useParams<Params>();
  const customer = useSearchParams().get("customer") ?? undefined;
  const dashboard = dashboardOf({ value: params.dashboard }) ?? dashboards[0] ?? "forecast";
  const defaultPeriod =
    dashboard === "forecast"
      ? presetPeriod({ today, preset: { key: "next30Days", days: 30 } })
      : presetPeriod({ today, preset: { key: "thisMonth", month: true } });
  const rawPeriod = { from: params.from ?? "", to: params.to ?? "" };
  const period = isValidPeriod(rawPeriod) ? rawPeriod : defaultPeriod;
  const direction = dashboard === "forecast" ? "forward" : "historical";
  return (
    <header className="grid gap-4">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <PeriodRange
            period={period}
            today={today}
            direction={direction}
            base={dashboardBase({ dashboard })}
            customerId={dashboard === "financials" ? customer : undefined}
          />
        }
      />
      <DashboardsNav dashboard={dashboard} dashboards={dashboards} />
    </header>
  );
}
