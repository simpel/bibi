import type { QuoteDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { quoteRoute } from "@/lib/routes";
import { formatKr } from "../../item/ui/format-price";
import { QuoteStatusBadge } from "./quote-status-badge";

export type QuoteVersionsProps = {
  quotes: readonly QuoteDto[];
  /** The version shown on the page, highlighted. */
  currentId?: string;
};

/** Every version of an inquiry's quote, newest first; each links to its page. */
export function QuoteVersions({ quotes, currentId }: QuoteVersionsProps) {
  const t = useTranslations("quote");
  const format = useFormatter();
  const locale = useLocale();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("fields.version")}</TableHead>
          <TableHead>{t("fields.status")}</TableHead>
          <TableHead>{t("fields.validUntil")}</TableHead>
          <TableHead>{t("totals.inclVat")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id} data-state={quote.id === currentId ? "selected" : undefined}>
            <TableCell className="font-medium">
              <Link href={quoteRoute({ id: quote.id })} className="hover:underline">
                {t("versionLabel", { version: quote.version })}
              </Link>
            </TableCell>
            <TableCell>
              <QuoteStatusBadge status={quote.quoteStatus} />
            </TableCell>
            <TableCell>
              {quote.validUntil ? format.dateTime(quote.validUntil, { dateStyle: "medium" }) : "–"}
            </TableCell>
            <TableCell>
              {t("amount", { amount: formatKr({ minor: quote.totalInclVatMinor, locale }) })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
