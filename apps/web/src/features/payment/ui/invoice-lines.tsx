import type { InvoiceDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { QuoteLinesTable } from "@/features/quote/ui/quote-lines-table";

/** The invoice's frozen lines, with one VAT row per rate for a bundle line. */
export function InvoiceLines({ invoice }: { invoice: Pick<InvoiceDto, "lines"> }) {
  const t = useTranslations("invoice");
  if (invoice.lines.length === 0) return null;
  return (
    <details className="pb-3 text-sm">
      <summary className="cursor-pointer text-muted-foreground">{t("lines")}</summary>
      <div className="mt-2">
        <QuoteLinesTable lines={invoice.lines} tableId="invoice.lines" />
      </div>
    </details>
  );
}
