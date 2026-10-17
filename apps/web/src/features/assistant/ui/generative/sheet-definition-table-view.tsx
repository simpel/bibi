"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { sheetDefinitionsRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SheetDefinitionTableViewProps = GenerativeProps<"sheet-definition-table">;

type Row = SheetDefinitionTableViewProps["items"][number];

function useSheetDefinitionColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.sheetDefinition");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (sheet) => sheet.name,
        cell: ({ row }) => (
          <Link href={sheetDefinitionsRoute()} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "contents",
        header: t("columns.contents"),
        accessorFn: (sheet) =>
          t("contents", {
            types: sheet.entityTypeIds.length,
            fields: sheet.fieldIds.length,
            lists: sheet.vocabularyIds.length,
          }),
      },
    ],
    [t],
  );
}

/** A page of sheet definitions; names link to the sheets settings page. */
export function SheetDefinitionTableView({ items, nextCursor }: SheetDefinitionTableViewProps) {
  const t = useTranslations("assistant.ui.sheetDefinition");
  const columns = useSheetDefinitionColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="sheet-definition-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.sheet-definition"
        columns={columns}
        data={items}
        getRowId={(sheet) => sheet.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
