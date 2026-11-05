import { dashboardSummary } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import type { Period } from "@/features/finance/lib/finance-period";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { AttentionPanel } from "./attention-panel";
import { ScheduledPanel } from "./scheduled-panel";
import { StatusStatCards } from "./status-stat-cards";
import { UtilisationPanel } from "./utilisation-panel";

export type WorkloadTabProps = { locale: Locale; period: Period };

/**
 * The Workload tab (ADR 0086): a stat card per open status, then what needs attention beside the
 * orders in the range, then utilisation beside what is booked and not yet invoiced.
 */
export async function WorkloadTab({ locale, period }: WorkloadTabProps) {
  const [numbers, dates, result] = await Promise.all([
    getNumberFormat(),
    getDateTimeFormat(),
    runOperation({ operation: dashboardSummary, input: period }),
  ]);
  if (!result.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  const summary = result.value;
  return (
    <div data-slot="workload" className="grid gap-6">
      <StatusStatCards summary={summary} dates={dates} numbers={numbers} />
      <div className="grid gap-4 md:grid-cols-2">
        <AttentionPanel summary={summary} dates={dates} numbers={numbers} />
        <ScheduledPanel summary={summary} dates={dates} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {summary.utilisation ? (
          <UtilisationPanel utilisation={summary.utilisation} numbers={numbers} />
        ) : null}
      </div>
    </div>
  );
}
