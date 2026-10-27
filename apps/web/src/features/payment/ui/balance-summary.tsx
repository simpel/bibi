import type { NumberFormat, TicketBalanceDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

export type BalanceSummaryProps = {
  balance: TicketBalanceDto;
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
};

/** What the ticket owes, derived (ADR 0057): billed, paid and what is left. */
export function BalanceSummary({ balance, numbers }: BalanceSummaryProps) {
  const t = useTranslations("payment.balance");
  const { money } = numbers;
  const figures = [
    { key: "billed", minor: balance.billedMinor },
    { key: "paid", minor: balance.paidMinor },
    { key: "balance", minor: balance.balanceMinor },
  ] as const;
  return (
    <div data-slot="balance-summary" className="grid gap-2">
      <dl className="grid grid-cols-3 gap-4 text-sm">
        {figures.map(({ key, minor }) => (
          <div key={key} className="grid gap-0.5">
            <dt className="text-muted-foreground">{t(key)}</dt>
            <dd className="text-base font-semibold">
              {money({ minor, currency: balance.currency })}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">{t(`billedFrom.${balance.billedFrom}`)}</p>
    </div>
  );
}
