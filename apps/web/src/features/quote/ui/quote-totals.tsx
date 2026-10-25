import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";

export type QuoteTotalsProps = {
  quote: { totalExclVatMinor: number; totalInclVatMinor: number; totalIsFrom: boolean };
};

/** Total excl. VAT, the VAT and the total incl. VAT; "from" prices while an alternative is open. */
export function QuoteTotals({ quote }: QuoteTotalsProps) {
  const t = useTranslations("quote");
  const { money } = useNumberFormat();
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
