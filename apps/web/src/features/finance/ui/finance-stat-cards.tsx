import type { DateTimeFormat, FinanceOverviewDto, NumberFormat, Trend } from "@bibi/core/schemas";
import { MoneyNumberFlow, StatCard, type StatCardProps, StatCards } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type Polarity, statSeries, statTrend } from "@/features/dashboard/lib/stat-trend";
import { useStatTexts } from "@/features/dashboard/lib/use-stat-texts";

export type FinanceStatCardsProps = {
  overview: Pick<FinanceOverviewDto, "trends" | "currency" | "timeZone">;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

type Key = "invoiced" | "received" | "outstanding" | "overdue";

const CARDS: readonly { key: Key; polarity: Polarity; tone: StatCardProps["tone"] }[] = [
  { key: "invoiced", polarity: "upIsGood", tone: "neutral" },
  { key: "received", polarity: "upIsGood", tone: "positive" },
  { key: "outstanding", polarity: "downIsGood", tone: "pending" },
  { key: "overdue", polarity: "downIsGood", tone: "negative" },
];

const HINTS: Partial<Record<Key, "exclVat" | "netOfRefunds">> = {
  invoiced: "exclVat",
  received: "netOfRefunds",
};

/**
 * Financials' headline figures as stat cards (ADR 0086): invoiced and received over the range,
 * outstanding and overdue at its end, each with its line and the change against the range before.
 */
export function FinanceStatCards({ overview, dates, numbers }: FinanceStatCardsProps) {
  const t = useTranslations("finance.kpi");
  const common = useTranslations("finance");
  const { trends, currency, timeZone } = overview;
  const texts = useStatTexts({
    ...{ size: trends?.bucketSize ?? "MONTH", timeZone, dates, numbers },
    value: ({ value }) => numbers.money({ minor: value, currency }),
  });
  const flow = numbers.moneyFlow({ currency });
  const amountOf = ({ key, trend }: { key: Key; trend: Trend | undefined }) =>
    trend ? (
      <MoneyNumberFlow value={trend.current / 100} flow={flow} memoryKey={`finance-stat:${key}`} />
    ) : (
      common("noAccessShort")
    );
  return (
    <StatCards data-slot="finance-stat-cards">
      {CARDS.map(({ key, polarity, tone }) => {
        const trend = trends?.[key];
        const hint = HINTS[key];
        return (
          <StatCard
            key={key}
            label={t(key)}
            tone={key === "overdue" && !trend?.current ? "neutral" : tone}
            value={amountOf({ key, trend })}
            {...(hint ? { hint: t(hint) } : {})}
            {...(trend ? { series: statSeries({ trend, texts }) } : {})}
            trend={trend ? statTrend({ trend, polarity, texts }) : null}
          />
        );
      })}
    </StatCards>
  );
}
