import type { NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

export type PaidOfProps = {
  paidMinor: number;
  amountMinor: number;
  currency?: string;
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
};

/** "1 000 kr paid of 5 600 kr": what is paid against a receivable's fixed amount. */
export function PaidOf({ paidMinor, amountMinor, currency, numbers }: PaidOfProps) {
  const t = useTranslations("payment");
  const { money } = numbers;
  return (
    <span className="text-muted-foreground">
      {t("paidOf", {
        paid: money({ minor: paidMinor, currency }),
        amount: money({ minor: amountMinor, currency }),
      })}
    </span>
  );
}
