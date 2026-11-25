import type { QuoteDto } from "@bibi/core";
import type { DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { StatCard, StatCards } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

export type QuoteStatsProps = {
  quote: QuoteDto;
  /** The version that counts now. */
  current: QuoteDto;
  numbers: NumberFormat;
  format: DateTimeFormat;
};

/** The version (and whether it is the current one), the total and the validity, as stat cards. */
export async function QuoteStats({ quote, current, numbers, format }: QuoteStatsProps) {
  const t = await getTranslations("quote");
  const { money } = numbers;
  const amount = ({ minor }: { minor: number }) =>
    quote.totalIsFrom ? t("totals.from", { amount: money({ minor }) }) : money({ minor });
  const isCurrent = current.id === quote.id;
  return (
    <StatCards>
      <StatCard
        label={t("fields.version")}
        value={String(quote.version)}
        tone={isCurrent ? "positive" : "neutral"}
        hint={isCurrent ? t("stats.current") : t("stats.notCurrent", { version: current.version })}
      />
      <StatCard
        label={t("totals.inclVat")}
        value={amount({ minor: quote.totalInclVatMinor })}
        hint={t("stats.exclVat", { amount: amount({ minor: quote.totalExclVatMinor }) })}
      />
      <StatCard
        label={t("fields.validUntil")}
        value={quote.validUntil ? format.date({ instant: quote.validUntil }) : "–"}
        hint={t(`statuses.${quote.quoteStatus}`)}
      />
    </StatCards>
  );
}
