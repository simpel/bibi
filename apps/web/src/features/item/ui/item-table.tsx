"use client";

import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useItemColumns } from "./use-item-columns";

export type ItemTableProps = {
  items: ItemDto[];
  types: EntityTypeDto[];
  venues: { id: string; name: string }[];
  venuesHidden?: boolean;
};

/** Item catalog rows: name (link to the detail page), type, venue and price. */
export function ItemTable({ items, types, venues, venuesHidden }: ItemTableProps) {
  const t = useTranslations("item");
  const common = useTranslations("common");
  const hidden = venuesHidden ? common("hidden") : undefined;
  const columns = useItemColumns({ types, venues, hidden });
  return (
    <PersistedDataTable
      tableId="item.catalog"
      columns={columns}
      data={items}
      getRowId={(item) => item.id}
      emptyText={t("empty")}
    />
  );
}
