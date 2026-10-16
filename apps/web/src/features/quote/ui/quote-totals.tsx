import { useLocale, useTranslations } from "next-intl";
import { formatKr } from "../../item/ui/format-price";

export type QuoteTotalsProps = {
  quote: { totalExclVatMinor: number; totalInclVatMinor: number };
};

/** Total excl. VAT, the VAT and the total incl. VAT. */
export function QuoteTotals({ quote }: QuoteTotalsProps) {
  const t = useTranslations("quote");
  const locale = useLocale();
  const kr = ({ minor }: { minor: number }) => t("amount", { amount: formatKr({ minor, locale }) });
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
