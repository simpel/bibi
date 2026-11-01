import { dashboardSummary } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { DashboardView } from "./dashboard-view";

export type DashboardPageProps = { locale: Locale };

/** `/dashboard`: the pipeline now, what needs attention and the next four weeks (ADR 0080). */
export async function DashboardPage({ locale }: DashboardPageProps) {
  const [numbers, dates, summary] = await Promise.all([
    getNumberFormat(),
    getDateTimeFormat(),
    runOperation({ operation: dashboardSummary, input: {} }),
  ]);
  if (!summary.ok) {
    return <ErrorState errorKey={handleLoadError({ error: summary.error, locale })} />;
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <DashboardView summary={summary.value} dates={dates} numbers={numbers} />
    </div>
  );
}
