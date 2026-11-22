import type { OrderVersionDto } from "@bibi/core/schemas";
import { actionsColumn, Badge, type ColumnDef, StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { QuoteStatusBadge } from "@/features/quote/ui/quote-status-badge";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { VersionRowActions, type VersionRowHandlers } from "./version-row-actions";

type Column = ColumnDef<OrderVersionDto>;

type Translate = ReturnType<typeof useTranslations<"orderVersion">>;

/** "Version 4", its name and where it came from. */
const versionColumn = ({ t }: { t: Translate }): Column => ({
  id: "version",
  header: t("fields.version"),
  accessorFn: (version) => version.number,
  cell: ({ row: { original: version } }) => (
    <span className="grid gap-0.5">
      <span className="flex items-center gap-2 font-medium">
        {t("versionLabel", { number: version.number })}
        {version.isCurrent ? <Badge variant="secondary">{t("current")}</Badge> : null}
      </span>
      {version.name ? <span className="text-sm">{version.name}</span> : null}
      {version.restoredFromNumber ? (
        <span className="text-xs text-muted-foreground">
          {t("restoredFrom", { number: version.restoredFromNumber })}
        </span>
      ) : null}
    </span>
  ),
});

/** The quotes sent as the version, each as "Quote v2" with its status. */
const quotesColumn = ({ t }: { t: Translate }): Column => ({
  id: "quotes",
  header: t("fields.quotes"),
  accessorFn: (version) => version.quotes.length,
  cell: ({ row: { original: version } }) =>
    version.quotes.length === 0 ? (
      "–"
    ) : (
      <span className="flex flex-wrap gap-1">
        {version.quotes.map((quote) => (
          <span key={quote.id} className="flex items-center gap-1 text-sm">
            {t("quoteLabel", { version: quote.version })}
            <QuoteStatusBadge status={quote.quoteStatus} />
          </span>
        ))}
      </span>
    ),
});

/** Version · quotes · captured · changes since · actions. */
export function useVersionColumns({ onShow, onName }: VersionRowHandlers): Column[] {
  const t = useTranslations("orderVersion");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return useMemo<Column[]>(
    () => [
      versionColumn({ t }),
      quotesColumn({ t }),
      {
        id: "capturedAt",
        header: t("fields.capturedAt"),
        accessorFn: (version) => version.capturedAt,
        cell: ({ row }) => format.dateTime({ instant: row.original.capturedAt }),
      },
      {
        id: "changes",
        header: t("fields.changes"),
        accessorFn: (version) => version.changeCount,
        cell: ({ row }) =>
          row.original.isCurrent ? (
            <StatusBadge label={t("matches")} color="var(--success)" />
          ) : (
            t("changeCount", { count: row.original.changeCount })
          ),
      },
      actionsColumn<OrderVersionDto>({
        label: common("actions"),
        cell: (version) => (
          <VersionRowActions version={version} onShow={onShow} {...(onName ? { onName } : {})} />
        ),
      }),
    ],
    [t, common, format, onShow, onName],
  );
}
