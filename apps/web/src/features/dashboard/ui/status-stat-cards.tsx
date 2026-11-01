import type { DashboardSummary, DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { StatCard, StatCards } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { statSeries, statTrend } from "../lib/stat-trend";
import { statusHint } from "../lib/status-hint";
import { useStatTexts } from "../lib/use-stat-texts";

export type StatusStatCardsProps = {
  summary: Pick<DashboardSummary, "statuses" | "bucketSize" | "timeZone" | "currency">;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

/**
 * One stat card per open status (ADR 0086): the open tickets now, their value, and the count's
 * line over the range. More open tickets is neither good nor bad, so the trend stays neutral.
 */
export function StatusStatCards({ summary, dates, numbers }: StatusStatCardsProps) {
  const t = useTranslations("dashboard.pipeline");
  const value = useTranslations("pipeline.phaseValue");
  const { statuses, bucketSize, timeZone, currency } = summary;
  const texts = useStatTexts({
    ...{ size: bucketSize, timeZone, dates, numbers },
    value: ({ value: count }) => t("tickets", { count }),
  });
  const labels = {
    confirmed: value("confirmedLabel"),
    estimated: value("estimatedLabel"),
    none: t("noValue"),
  };
  const money = ({ minor }: { minor: number }) => numbers.money({ minor, currency });
  if (statuses.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <StatCards data-slot="status-stat-cards">
      {statuses.map((status) => {
        const trend = statTrend({ trend: status.trend, polarity: "upIsGood", texts });
        return (
          <StatCard
            key={status.statusId}
            label={status.name}
            value={numbers.number({ value: status.tickets })}
            hint={statusHint({ ...status, money, labels })}
            series={statSeries({ trend: status.trend, texts })}
            trend={trend && { ...trend, tone: "neutral" }}
          />
        );
      })}
    </StatCards>
  );
}
