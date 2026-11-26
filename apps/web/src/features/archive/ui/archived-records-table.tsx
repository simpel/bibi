"use client";

import { actionsColumn, createTableColumns, dateColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import type { ArchivedRow } from "./archived-row";
import { ArchivedRowActions, ArchivedRowMenu } from "./archived-row-actions";

export type ArchivedRecordsTableProps = { rows: ArchivedRow[] };

/** Archived records: name, kind, when archived and deleted, with Restore and Delete permanently. */
export function ArchivedRecordsTable({ rows }: ArchivedRecordsTableProps) {
  const t = useTranslations("archive");
  const common = useTranslations("common");
  const kindLabel = useCallback((kind: ArchivedRow["kind"]) => t(`kinds.${kind}`), [t]);
  const qualifiers = useMemo<TableQualifier<ArchivedRow>[]>(() => {
    const options = [...new Set(rows.map((row) => kindLabel(row.kind)))];
    return [
      {
        key: "kind",
        label: t("filterKind"),
        hint: options.join(", ") || t("filterKind"),
        pick: (row) => kindLabel(row.kind),
        options,
      },
    ];
  }, [rows, t, kindLabel]);
  const columns = createTableColumns<ArchivedRow>({
    primary: [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (row) => row.name,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
    ],
    relations: [
      { id: "kind", header: t("columns.kind"), accessorFn: (row) => kindLabel(row.kind) },
    ],
    dates: [
      dateColumn<ArchivedRow>({
        id: "archivedAt",
        header: t("columns.archivedAt"),
        getSortValue: (row) => row.archivedMs,
        cell: (row) => row.archivedLabel,
      }),
      dateColumn<ArchivedRow>({
        id: "deletesOn",
        header: t("columns.deletesOn"),
        getSortValue: (row) => row.deletesMs,
        cell: (row) => row.deletesLabel,
      }),
    ],
    actions: [
      actionsColumn<ArchivedRow>({
        label: common("actions"),
        cell: (row) => <ArchivedRowActions record={row} />,
      }),
    ],
  });
  return (
    <ClientDataTable
      tableId="archive.list"
      columns={columns}
      data={rows}
      qualifiers={qualifiers}
      getSearchText={(row) => `${row.name} ${kindLabel(row.kind)}`}
      getRowId={(row) => `${row.kind}:${row.id}`}
      rowMenu={(row) => <ArchivedRowMenu record={row} />}
      emptyText={t("empty")}
    />
  );
}
