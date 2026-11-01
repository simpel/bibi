import type { NumberFormat, OutcomeMonth } from "@bibi/core/schemas";
import type { ChartRow } from "@bibi/ui";

export type OutcomeRowsInput = {
  outcomes: readonly OutcomeMonth[];
  numbers: NumberFormat;
  currency: string;
  monthLabel: (input: { month: string }) => string;
  /** `finance.outcomes.text`: the count and the value of one bar. */
  text: (values: { count: number; amount: string }) => string;
  money: (input: { numbers: NumberFormat; minor: number; currency: string }) => string;
};

/** Won then lost per month; the bar is the count, the text adds the value. */
export function outcomeRows({
  outcomes,
  numbers,
  currency,
  monthLabel,
  text,
  money,
}: OutcomeRowsInput): ChartRow[] {
  const point = ({ count, minor }: { count: number; minor: number }) => ({
    value: count,
    text: text({ count, amount: money({ numbers, minor, currency }) }),
  });
  return outcomes.map((row) => ({
    label: monthLabel({ month: row.month }),
    points: [
      point({ count: row.wonTickets, minor: row.wonValueMinor }),
      point({ count: row.lostTickets, minor: row.lostValueMinor }),
    ],
  }));
}

/** Won share of the closed tickets in the period, `null` when none closed. */
export function winRate({ outcomes }: { outcomes: readonly OutcomeMonth[] }) {
  const won = outcomes.reduce((sum, row) => sum + row.wonTickets, 0);
  const total = won + outcomes.reduce((sum, row) => sum + row.lostTickets, 0);
  return total === 0 ? null : { won, total, rate: won / total };
}
