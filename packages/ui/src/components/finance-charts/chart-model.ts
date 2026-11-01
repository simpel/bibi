/** One bar series of a chart (its legend entry and table column). */
export type ChartSeries = { label: string };

/** One value of one series: the number the bar is drawn from and the text the viewer reads. */
export type ChartPoint = { value: number; text: string };

/** One category (a month, a bucket, a type) with one point per series, in series order. */
export type ChartRow = { label: string; points: ChartPoint[] };

export type ChartDatum = Record<string, string | number>;

export type ToChartDataInput = { rows: ChartRow[] };

/** Flat rows for recharts: `v<i>` is the value and `t<i>` the text of series `i`. */
export function toChartData({ rows }: ToChartDataInput): ChartDatum[] {
  return rows.map(({ label, points }) => {
    const datum: ChartDatum = { label };
    points.forEach((point, index) => {
      datum[`v${index}`] = point.value;
      datum[`t${index}`] = point.text;
    });
    return datum;
  });
}
