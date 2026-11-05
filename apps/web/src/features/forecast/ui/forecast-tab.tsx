import type { PlainDate } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { BookedAheadCard } from "@/features/dashboard/ui/booked-ahead-card";
import type { Period } from "@/features/finance/lib/finance-period";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { loadForecastData } from "../lib/load-forecast-data";
import { ForecastProjectionCard } from "./forecast-projection-card";
import { ForecastStatCards } from "./forecast-stat-cards";

export type ForecastTabProps = {
  locale: Locale;
  period: Period;
  today: PlainDate;
  customerId?: string | undefined;
};

export async function ForecastTab({ locale, period, today, customerId }: ForecastTabProps) {
  const [numbers, dates, result] = await Promise.all([
    getNumberFormat(),
    getDateTimeFormat(),
    loadForecastData({ period, today, customerId }),
  ]);

  if (!result.ok) {
    return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  }

  const { forwardSummary, projectedMonthly } = result.value;
  const currency = forwardSummary.currency;

  return (
    <div data-slot="forecast" className="grid gap-6">
      <ForecastStatCards data={result.value} currency={currency} numbers={numbers} dates={dates} />
      <div className="grid gap-4 md:grid-cols-2">
        <ForecastProjectionCard
          projectedMonthly={projectedMonthly}
          currency={currency}
          numbers={numbers}
        />
        {forwardSummary.bookedAhead ? (
          <BookedAheadCard summary={forwardSummary} numbers={numbers} />
        ) : null}
      </div>
    </div>
  );
}
