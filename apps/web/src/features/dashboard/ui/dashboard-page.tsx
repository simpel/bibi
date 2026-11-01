import { dashboardSummary, financeOverview } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { financeToday } from "@/features/finance/finance-path";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { DashboardView } from "./dashboard-view";

export type DashboardPageProps = { locale: Locale; from: string; to: string };

/** `/dashboard/{from}/{to}`: the pipeline now and the period's outcomes, money and utilisation (ADR 0079). */
export async function DashboardPage({ locale, from, to }: DashboardPageProps) {
  const input = { from, to };
  const [numbers, dates, today, abilities, summary] = await Promise.all([
    getNumberFormat(),
    getDateTimeFormat(),
    financeToday(),
    getCallerAbilities(),
    runOperation({ operation: dashboardSummary, input }),
  ]);
  if (!summary.ok) {
    return <ErrorState errorKey={handleLoadError({ error: summary.error, locale })} />;
  }
  const money = can({ abilities, permission: "finance:read" })
    ? await runOperation({ operation: financeOverview, input })
    : null;
  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <DashboardView
        summary={summary.value}
        overview={money?.ok ? money.value : null}
        today={today}
        dates={dates}
        numbers={numbers}
      />
    </div>
  );
}
