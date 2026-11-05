import type { DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { MoneyNumberFlow, StatCard, StatCards } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ForecastData } from "../lib/load-forecast-data";

export type ForecastStatCardsProps = {
  data: ForecastData;
  currency: string;
  numbers: NumberFormat;
  dates: DateTimeFormat;
};

export function ForecastStatCards({ data, currency, numbers }: ForecastStatCardsProps) {
  const t = useTranslations("dashboard.forecast");
  const flow = numbers.moneyFlow({ currency });

  return (
    <StatCards data-slot="forecast-stat-cards">
      <StatCard
        label={t("expectedRevenue")}
        tone="positive"
        value={
          <MoneyNumberFlow
            value={data.expectedInvoicedMinor / 100}
            flow={flow}
            memoryKey="forecast:expected"
          />
        }
        hint={t("confidenceNote")}
      />
      <StatCard
        label={t("bookedConfirmed")}
        tone="neutral"
        value={
          <MoneyNumberFlow
            value={data.confirmedBookedMinor / 100}
            flow={flow}
            memoryKey="forecast:booked"
          />
        }
      />
      <StatCard
        label={t("weightedPipeline")}
        tone="pending"
        value={
          <MoneyNumberFlow
            value={data.pipelinePotentialMinor / 100}
            flow={flow}
            memoryKey="forecast:pipeline"
          />
        }
      />
    </StatCards>
  );
}
