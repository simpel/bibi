import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { QuoteStatusBadge } from "@/features/quote/ui/quote-status-badge";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { quoteRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
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
  const format = useDateTimeFormat();
  const { money } = useNumberFormat();
  return useMemo(
    () => [
      versionColumn({ t }),
      {
        id: "validUntil",
        header: t("columns.validUntil"),
        accessorFn: (q) => (q.validUntil ? new Date(q.validUntil) : undefined),
        cell: ({ row }) =>
          row.original.validUntil ? format.date({ instant: row.original.validUntil }) : "–",
      },
      {
        id: "total",
        header: t("columns.total"),
        accessorFn: (q) => q.totalInclVatMinor,
        cell: ({ row }) => money({ minor: row.original.totalInclVatMinor }),
      },
      {
        id: "status",
        header: t("columns.status"),
        accessorFn: (q) => q.quoteStatus,
        cell: ({ row }) => <QuoteStatusBadge status={row.original.quoteStatus} />,
      },
    ],
    [t, format, money],
  );
}
