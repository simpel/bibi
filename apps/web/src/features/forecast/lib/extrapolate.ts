export type ExtrapolateInput = {
  /** Historical values (e.g. historical monthly amounts), ordered chronologically. */
  history: number[];
  /** How many forward steps/periods to extrapolate. */
  horizonCount: number;
};

export type ExtrapolateResult = {
  /** The forecasted values for each forward period step. */
  forecast: number[];
  /** Average rate of change per period (slope). */
  slope: number;
  /** Baseline average. */
  average: number;
};

/**
 * Extrapolates future periods using a combination of linear regression and exponential weighting.
 * Guarantees non-negative forecasts for financial amounts.
 */
export function extrapolateSeries({ history, horizonCount }: ExtrapolateInput): ExtrapolateResult {
  if (horizonCount <= 0) {
    return { forecast: [], slope: 0, average: 0 };
  }

  const clean = history.map((val) => (Number.isFinite(val) ? val : 0));
  const n = clean.length;

  if (n === 0) {
    return {
      forecast: new Array(horizonCount).fill(0),
      slope: 0,
      average: 0,
    };
  }

  if (n === 1) {
    const baseline = Math.max(0, clean[0] ?? 0);
    return {
      forecast: new Array(horizonCount).fill(baseline),
      slope: 0,
      average: baseline,
    };
  }

  // Ordinary Least Squares (OLS) Linear Regression: y = a + b * x
  // with x = 0, 1, ..., n-1
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const y = clean[i] ?? 0;
    sumX += i;
    sumY += y;
    sumXY += i * y;
    sumXX += i * i;
  }

  const denom = n * sumXX - sumX * sumX;
  const rawSlope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const average = Math.max(0, sumY / n);

  // Moderate the slope so extreme historical variance doesn't produce wildly runaway projections
  const maxSlope = average * 0.5;
  const slope = Math.max(-maxSlope, Math.min(maxSlope, rawSlope));
  const intercept = (sumY - slope * sumX) / n;

  // Recent 3-period weighted moving average for anchoring
  const recentWindow = clean.slice(-3);
  const weightedRecent =
    recentWindow.reduce((acc, val, idx) => acc + val * (idx + 1), 0) /
    recentWindow.reduce((acc, _, idx) => acc + (idx + 1), 0);

  const forecast: number[] = [];

  for (let step = 1; step <= horizonCount; step++) {
    const x = n - 1 + step;
    const trendValue = intercept + slope * x;

    // Blend trend projection with recent weighted average (damping over time)
    const weight = Math.max(0.2, 1 - step * 0.1);
    const blended = trendValue * (1 - weight) + (weightedRecent + slope * step) * weight;

    forecast.push(Math.max(0, Math.round(blended)));
  }

  return { forecast, slope, average };
}
