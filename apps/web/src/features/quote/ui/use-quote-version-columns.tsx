import type { QuoteDto } from "@bibi/core";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { quoteRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { QuoteStatusBadge } from "./quote-status-badge";

type Column = ColumnDef<QuoteDto>;

type Translate = ReturnType<typeof useTranslations<"quote">>;

const versionColumn = ({ t }: { t: Translate }): Column => ({
  id: "version",
  header: t("fields.version"),
  accessorFn: (quote) => quote.version,
  cell: ({ row }) => (
    <Link href={quoteRoute({ id: row.original.id })} className="font-medium hover:underline">
      {t("versionLabel", { version: row.original.version })}
    </Link>
  ),
});

/** Version (link) · status · valid until · total incl. VAT. */
export function useQuoteVersionColumns(): Column[] {
  const t = useTranslations("quote");
  const format = useDateTimeFormat();
  const { money } = useNumberFormat();
  return useMemo<Column[]>(
    () => [
      versionColumn({ t }),
      {
        id: "status",
        header: t("fields.status"),
        accessorFn: (quote) => quote.quoteStatus,
        cell: ({ row }) => <QuoteStatusBadge status={row.original.quoteStatus} />,
      },
      {
        id: "validUntil",
        header: t("fields.validUntil"),
        accessorFn: (quote) => quote.validUntil ?? undefined,
        cell: ({ row }) =>
          row.original.validUntil ? format.date({ instant: row.original.validUntil }) : "–",
      },
      {
        id: "total",
        header: t("totals.inclVat"),
        accessorFn: (quote) => quote.totalInclVatMinor,
        cell: ({ row }) => money({ minor: row.original.totalInclVatMinor }),
      },
    ],
    [t, format, money],
  );
}
