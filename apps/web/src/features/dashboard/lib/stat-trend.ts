import type { Trend } from "@bibi/core/schemas";
import type { StatPoint, StatTrend } from "@bibi/ui";

/** Which way is good for the figure: more received is good, more overdue is bad (ADR 0086). */
export type Polarity = "upIsGood" | "downIsGood";

export type StatTexts = {
  /** The figure written out, e.g. "12 400 kr" or "8 orders". */
  value: (input: { value: number }) => string;
  /** The bucket's first day as the tooltip's label. */
  bucket: (input: { bucket: string }) => string;
  /** A whole percentage with its sign, e.g. "+12 %". */
  percent: (input: { value: number }) => string;
  /** What the percentage compares with, e.g. "vs. the previous period". */
  description: string;
};

/** The background line's points, labelled and written out on the server. */
export function statSeries({ trend, texts }: { trend: Trend; texts: StatTexts }): StatPoint[] {
  return trend.series.map((point) => ({
    label: texts.bucket({ bucket: point.bucket }),
    value: point.value,
    text: texts.value({ value: point.value }),
  }));
}

export type StatTrendInput = { trend: Trend; polarity: Polarity; texts: StatTexts };

/** The change against the previous range; none without a previous value to compare with. */
export function statTrend({ trend, polarity, texts }: StatTrendInput): StatTrend | null {
  const { current, previous } = trend;
  if (previous === null || previous === 0) return null;
  const change = (current - previous) / Math.abs(previous);
  const rounded = Math.round(change * 100);
  const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const good = polarity === "upIsGood" ? direction === "up" : direction === "down";
  return {
    direction,
    tone: direction === "flat" ? "neutral" : good ? "good" : "bad",
    text: texts.percent({ value: rounded }),
    description: texts.description,
  };
}
