import "server-only";

import { type DashboardSummary, dashboardSummary, financeOverview, type Result } from "@bibi/core";
import { addMonths, type PlainDate, toIsoDate } from "@bibi/core/schemas";
import type { Period } from "@/features/finance/lib/finance-period";
import { runOperation } from "@/server/run-operation";
import { extrapolateSeries } from "./extrapolate";

export type ForecastData = {
  forwardSummary: DashboardSummary;
  projectedMonthly: { month: string; valueMinor: number }[];
  expectedInvoicedMinor: number;
  confirmedBookedMinor: number;
  pipelinePotentialMinor: number;
  confidenceAverageMinor: number;
};

type LoadForecastInput = {
  period: Period;
  today: PlainDate;
  customerId?: string | undefined;
};

/** Loads forward dashboard summary + historical finance run rate to extrapolate forward projections. */
export async function loadForecastData({
  period,
  today,
  customerId,
}: LoadForecastInput): Promise<Result<ForecastData>> {
  // Both reads are independent: forward dashboard data and the past 6 months for the run rate.
  const historicalFrom = toIsoDate({ date: addMonths({ date: today, months: -6 }) });
  const historicalTo = toIsoDate({ date: today });
  const [summaryRes, historyRes] = await Promise.all([
    runOperation({ operation: dashboardSummary, input: period }),
    runOperation({
      operation: financeOverview,
      input: { from: historicalFrom, to: historicalTo, ...(customerId ? { customerId } : {}) },
    }),
  ]);

  if (!summaryRes.ok) return summaryRes;

  const historyMonthly = historyRes.ok && historyRes.value.monthly ? historyRes.value.monthly : [];
  const historicalAmounts = historyMonthly.map((m) => m.invoicedExclVatMinor);

  // Compute forward months in the period
  const forwardMonths = summaryRes.value.bookedAhead?.map((b) => b.month) ?? [];
  const horizonCount = Math.max(1, forwardMonths.length);

  const { forecast, average } = extrapolateSeries({
    history: historicalAmounts,
    horizonCount,
  });

  const projectedMonthly = forwardMonths.map((month, idx) => ({
    month,
    valueMinor: forecast[idx] ?? average,
  }));

  const confirmedBookedMinor = (summaryRes.value.bookedAhead ?? []).reduce(
    (sum, b) => sum + b.valueExclVatMinor,
    0,
  );

  const pipelinePotentialMinor = summaryRes.value.statuses.reduce(
    (sum, s) => sum + (s.confirmedValueMinor ?? s.estimatedValueMinor ?? 0),
    0,
  );

  const expectedInvoicedMinor = Math.max(
    confirmedBookedMinor,
    projectedMonthly.reduce((sum, p) => sum + p.valueMinor, 0),
  );

  return {
    ok: true,
    value: {
      forwardSummary: summaryRes.value,
      projectedMonthly,
      expectedInvoicedMinor,
      confirmedBookedMinor,
      pipelinePotentialMinor,
      confidenceAverageMinor: average,
    },
  };
}
