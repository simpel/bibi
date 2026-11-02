import type { NumberFormat, TicketBalanceDto } from "@bibi/core/schemas";
import { StatCard, type StatCardProps, StatCards } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type BalanceSummaryProps = {
  balance: TicketBalanceDto;
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
};

type Figure = { key: "billed" | "paid" | "balance"; minor: number; tone: StatCardProps["tone"] };

/**
 * What the ticket owes, derived (ADR 0057): billed, paid and what is left, as the dashboards'
 * stat cards (ADR 0086). Nothing left to pay shows as neutral.
 */
export function BalanceSummary({ balance, numbers }: BalanceSummaryProps) {
  const t = useTranslations("payment.balance");
  const figures: readonly Figure[] = [
    { key: "billed", minor: balance.billedMinor, tone: "neutral" },
    { key: "paid", minor: balance.paidMinor, tone: "positive" },
    {
      key: "balance",
      minor: balance.balanceMinor,
      tone: balance.balanceMinor ? "pending" : "neutral",
    },
  ];
  return (
    <StatCards data-slot="balance-summary">
      {figures.map(({ key, minor, tone }) => (
        <StatCard
          key={key}
          label={t(key)}
          tone={tone}
          value={numbers.money({ minor, currency: balance.currency })}
          {...(key === "billed" ? { hint: t(`billedFrom.${balance.billedFrom}`) } : {})}
        />
      ))}
    </StatCards>
  );
}
