"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { workOrderDefinitionsRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type WorkOrderDefinitionTableViewProps = GenerativeProps<"work-order-definition-table">;

type Row = WorkOrderDefinitionTableViewProps["items"][number];

function useWorkOrderDefinitionColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.workOrderDefinition");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (workOrder) => workOrder.name,
        cell: ({ row }) => (
          <Link href={workOrderDefinitionsRoute()} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "contents",
        header: t("columns.contents"),
        accessorFn: (workOrder) =>
          t("contents", {
            types: workOrder.entityTypeIds.length,
            fields: workOrder.fieldIds.length,
            lists: workOrder.vocabularyIds.length,
          }),
      },
    ],
    [t],
  );
}

/** A page of work order definitions; names link to the work orders settings page. */
export function WorkOrderDefinitionTableView({
  items,
  nextCursor,
}: WorkOrderDefinitionTableViewProps) {
  const t = useTranslations("assistant.ui.workOrderDefinition");
  const columns = useWorkOrderDefinitionColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="work-order-definition-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.work-order-definition"
        columns={columns}
        data={items}
        getRowId={(workOrder) => workOrder.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
