import type { NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";

export type QuoteTotalsProps = {
  quote: { totalExclVatMinor: number; totalInclVatMinor: number; totalIsFrom: boolean };
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
};

/** Total excl. VAT, the VAT and the total incl. VAT; "from" prices while an alternative is open. */
export function QuoteTotals({ quote, numbers }: QuoteTotalsProps) {
  const t = useTranslations("quote");
  const { money } = numbers;
  const kr = ({ minor }: { minor: number }) => {
    const amount = money({ minor });
    return quote.totalIsFrom ? t("totals.from", { amount }) : amount;
  };
  const rows = [
    { label: t("totals.exclVat"), value: kr({ minor: quote.totalExclVatMinor }) },
    {
      label: t("totals.vat"),
      value: kr({ minor: quote.totalInclVatMinor - quote.totalExclVatMinor }),
    },
    { label: t("totals.inclVat"), value: kr({ minor: quote.totalInclVatMinor }) },
  ];
  return (
    <dl className="grid gap-1 text-sm sm:ml-auto sm:w-72">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
