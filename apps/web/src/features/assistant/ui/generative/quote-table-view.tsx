"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatKr } from "@/features/item/ui/format-price";
import { QuoteStatusBadge } from "@/features/quote/ui/quote-status-badge";
import { quoteRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

const COLUMNS = ["version", "validUntil", "total", "status"] as const;

export type QuoteTableViewProps = GenerativeProps<"quote-table">;

/** A page of quotes; each row links to the quote page. */
export function QuoteTableView({ items, nextCursor }: QuoteTableViewProps) {
  const t = useTranslations("assistant.ui.quote");
  const format = useFormatter();
  const locale = useLocale();
  const day = ({ value }: { value: string | null }) =>
    value ? format.dateTime(new Date(value), { dateStyle: "medium" }) : "–";
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="quote-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((key) => (
              <TableHead key={key}>{t(`columns.${key}`)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">
                <Link href={quoteRoute({ id: quote.id })} className="hover:underline">
                  {t("title", { version: quote.version })}
                </Link>
              </TableCell>
              <TableCell>{day({ value: quote.validUntil })}</TableCell>
              <TableCell>
                {t("amount", { amount: formatKr({ minor: quote.totalInclVatMinor, locale }) })}
              </TableCell>
              <TableCell>
                <QuoteStatusBadge status={quote.quoteStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
