import type { DashboardSummary, DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { MoneyNumberFlow, StatCard, StatCards } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { statSeries, statTrend } from "../lib/stat-trend";
import { statusHint } from "../lib/status-hint";
import { useStatTexts } from "../lib/use-stat-texts";

/** A count in the number format's separators, animated like the money figures. */
const WHOLE = { minimumFractionDigits: 0, maximumFractionDigits: 0 };

export type StatusStatCardsProps = {
  summary: Pick<DashboardSummary, "statuses" | "bucketSize" | "timeZone" | "currency">;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

/**
 * One stat card per open status (ADR 0086): the open orders now, their value, and the count's
 * line over the range. More open orders is neither good nor bad, so the trend stays neutral.
 */
export function StatusStatCards({ summary, dates, numbers }: StatusStatCardsProps) {
  const t = useTranslations("dashboard.pipeline");
  const value = useTranslations("pipeline.phaseValue");
  const { statuses, bucketSize, timeZone, currency } = summary;
  const texts = useStatTexts({
    ...{ size: bucketSize, timeZone, dates, numbers },
    value: ({ value: count }) => t("orders", { count }),
  });
  const labels = { confirmed: value("confirmedLabel"), estimated: value("estimatedLabel") };
  const money = ({ minor }: { minor: number }) => numbers.money({ minor, currency });
  const countFlow = { ...numbers.moneyFlow({ currency }), prefix: "", suffix: "" };
  if (statuses.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <StatCards data-slot="status-stat-cards">
      {statuses.map((status) => {
        const trend = statTrend({ trend: status.trend, polarity: "upIsGood", texts });
        return (
          <StatCard
            key={status.statusId}
            label={status.name}
            value={
              <MoneyNumberFlow
                value={status.orders}
                flow={countFlow}
                format={WHOLE}
                memoryKey={`status-stat:${status.statusId}`}
              />
            }
            hint={statusHint({ ...status, money, labels: { ...labels, none: t("noValue") } })}
            series={statSeries({ trend: status.trend, texts })}
            trend={trend && { ...trend, tone: "neutral" }}
          />
        );
      })}
    </StatCards>
  );
}
