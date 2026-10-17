import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { formatKr } from "@/features/item/ui/format-price";
import { QuoteStatusBadge } from "@/features/quote/ui/quote-status-badge";
import { quoteRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type QuoteCardRow = GenerativeProps<"quote-table">["items"][number];

type Translate = ReturnType<typeof useTranslations<"assistant.ui.quote">>;

const versionColumn = ({ t }: { t: Translate }): ColumnDef<QuoteCardRow> => ({
  id: "version",
  header: t("columns.version"),
  accessorFn: (q) => q.version,
  cell: ({ row }) => (
    <Link href={quoteRoute({ id: row.original.id })} className="font-medium hover:underline">
      {t("title", { version: row.original.version })}
    </Link>
  ),
});

/** Version (links to the quote) · valid until · total · status. */
export function useQuoteCardColumns(): ColumnDef<QuoteCardRow>[] {
  const t = useTranslations("assistant.ui.quote");
  const format = useFormatter();
  const locale = useLocale();
  return useMemo(
    () => [
      versionColumn({ t }),
      {
        id: "validUntil",
        header: t("columns.validUntil"),
        accessorFn: (q) => (q.validUntil ? new Date(q.validUntil) : undefined),
        cell: ({ row }) =>
          row.original.validUntil
            ? format.dateTime(new Date(row.original.validUntil), { dateStyle: "medium" })
            : "–",
      },
      {
        id: "total",
        header: t("columns.total"),
        accessorFn: (q) => q.totalInclVatMinor,
        cell: ({ row }) =>
          t("amount", { amount: formatKr({ minor: row.original.totalInclVatMinor, locale }) }),
      },
      {
        id: "status",
        header: t("columns.status"),
        accessorFn: (q) => q.quoteStatus,
        cell: ({ row }) => <QuoteStatusBadge status={row.original.quoteStatus} />,
      },
    ],
    [t, format, locale],
  );
}
