"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { runSheetDefinitionsRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type RunSheetDefinitionTableViewProps = GenerativeProps<"run-sheet-definition-table">;

type Row = RunSheetDefinitionTableViewProps["items"][number];

function useRunSheetDefinitionColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.runSheetDefinition");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (runSheet) => runSheet.name,
        cell: ({ row }) => (
          <Link href={runSheetDefinitionsRoute()} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "contents",
        header: t("columns.contents"),
        accessorFn: (runSheet) =>
          t("contents", {
            types: runSheet.entityTypeIds.length,
            fields: runSheet.fieldIds.length,
            lists: runSheet.vocabularyIds.length,
          }),
      },
    ],
    [t],
  );
}

/** A page of run sheet definitions; names link to the run sheets settings page. */
export function RunSheetDefinitionTableView({
  items,
  nextCursor,
}: RunSheetDefinitionTableViewProps) {
  const t = useTranslations("assistant.ui.runSheetDefinition");
  const columns = useRunSheetDefinitionColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="run-sheet-definition-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.run-sheet-definition"
        columns={columns}
        data={items}
        getRowId={(runSheet) => runSheet.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
