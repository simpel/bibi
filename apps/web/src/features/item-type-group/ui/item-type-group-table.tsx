"use client";

import type { ItemTypeGroupDto } from "@bibi/core";
import { actionsColumn, type ColumnDef, createTableColumns } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { ItemTypeGroupRowActions } from "./item-type-group-row-actions";

export type ItemTypeGroupTableProps = { groups: ItemTypeGroupDto[]; access: RowAccess };

type Column = ColumnDef<ItemTypeGroupDto>;

/** The groups in their order: name and the row actions (edit, move, archive). */
export function ItemTypeGroupTable({ groups, access }: ItemTypeGroupTableProps) {
  const t = useTranslations("itemTypeGroup");
  const common = useTranslations("common");
  const columns = useMemo<Column[]>(() => {
    const ids = groups.map((group) => group.id);
    return createTableColumns<ItemTypeGroupDto>({
      primary: [{ id: "name", header: t("columns.name"), accessorFn: (group) => group.name }],
      actions:
        access.canEdit || access.canRemove
          ? [
              actionsColumn<ItemTypeGroupDto>({
                label: common("actions"),
                cell: (group) => (
                  <ItemTypeGroupRowActions group={group} ids={ids} access={access} />
                ),
              }),
            ]
          : [],
    });
  }, [groups, access, t, common]);
  return (
    <PersistedDataTable
      tableId="itemTypeGroup.list"
      columns={columns}
      data={groups}
      getRowId={(group) => group.id}
      emptyText={t("empty")}
    />
  );
}
