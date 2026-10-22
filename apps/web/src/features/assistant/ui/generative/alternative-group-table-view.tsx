"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type AlternativeGroupTableViewProps = GenerativeProps<"alternative-group-table">;

type Row = AlternativeGroupTableViewProps["items"][number];

function useAlternativeGroupViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.alternativeGroup");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (group) => group.name,
        cell: ({ row }) => (
          <Link
            href={ticketRoute({ id: row.original.ticketId })}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "status",
        header: t("columns.status"),
        accessorFn: (group) => (group.chosenLineId ? 1 : 0),
        cell: ({ row }) => (row.original.chosenLineId ? t("chosen") : t("open")),
      },
      {
        id: "options",
        header: t("columns.options"),
        accessorFn: (group) => group.optionLineIds.length,
      },
    ],
    [t],
  );
}

/** A page of alternative groups; each name links to its ticket's page. */
export function AlternativeGroupTableView({ items, nextCursor }: AlternativeGroupTableViewProps) {
  const t = useTranslations("assistant.ui.alternativeGroup");
  const columns = useAlternativeGroupViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="alternative-group-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.alternativeGroup"
        columns={columns}
        data={items}
        getRowId={(group) => group.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
