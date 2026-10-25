import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";

export type PaidOfProps = { paidMinor: number; amountMinor: number; currency?: string };

/** "1 000 kr paid of 5 600 kr": what is paid against a receivable's fixed amount. */
export function PaidOf({ paidMinor, amountMinor, currency }: PaidOfProps) {
  const t = useTranslations("payment");
  const { money } = useNumberFormat();
  return (
    <span className="text-muted-foreground">
      {t("paidOf", {
        paid: money({ minor: paidMinor, currency }),
        amount: money({ minor: amountMinor, currency }),
      })}
    </span>
  );
}
