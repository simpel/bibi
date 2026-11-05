"use client";

import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import { itemRoute } from "@/lib/configuration-routes";
import { useRouter } from "@/lib/navigation";
import { ItemRowActions, ItemRowMenu } from "./item-row-actions";
import { useItemColumns } from "./use-item-columns";

export type ItemTableProps = {
  items: ItemDto[];
  types: EntityTypeDto[];
  venues: { id: string; name: string }[];
  venuesHidden?: boolean;
  canEdit?: boolean | undefined;
  filterBar?: ReactNode;
  withControls?: boolean | undefined;
};

function useItemQualifiers({
  types,
  venues,
}: {
  types: EntityTypeDto[];
  venues: { id: string; name: string }[];
}): TableQualifier<ItemDto>[] {
  const t = useTranslations("item.columns");
  return useMemo(
    () => [
      {
        key: "type",
        label: t("type"),
        hint: types.map((type) => type.name).join(", ") || t("type"),
        pick: (item) => types.find((type) => type.id === item.entityTypeId)?.name,
        options: types.map((type) => type.name),
      },
      {
        key: "venue",
        label: t("venue"),
        hint: venues.map((venue) => venue.name).join(", ") || t("venue"),
        pick: (item) => venues.find((venue) => venue.id === item.venueId)?.name,
        options: venues.map((venue) => venue.name),
      },
    ],
    [t, types, venues],
  );
}

/** Item catalog rows: name (link to the detail page), type, venue, price and sticky actions. */
export function ItemTable({
  items,
  types,
  venues,
  venuesHidden,
  canEdit = false,
  filterBar,
  withControls = false,
}: ItemTableProps) {
  const t = useTranslations("item");
  const common = useTranslations("common");
  const router = useRouter();
  const hidden = venuesHidden ? common("hidden") : undefined;
  const qualifiers = useItemQualifiers({ types, venues });
  const view = useClientTableView({
    rows: items,
    qualifiers,
    getSearchText: (item) => `${item.name} ${item.description ?? ""}`,
    totalLabel: (count) => `${count}`,
  });
  const columns = useItemColumns({
    types,
    venues,
    hidden,
    renderActions: (item) => <ItemRowActions item={item} canEdit={canEdit} />,
  });
  return (
    <div className="grid gap-4">
      {withControls ? (
        <TableFilterBar q={view.q} query={view.query} placeholder={t("search")}>
          {filterBar}
        </TableFilterBar>
      ) : null}
      <PersistedDataTable
        tableId="item.catalog"
        columns={columns}
        data={withControls ? view.rows : items}
        getRowId={(item) => item.id}
        onRowClick={(item) => router.push(itemRoute({ id: item.id }))}
        rowMenu={(item) => <ItemRowMenu item={item} canEdit={canEdit} />}
        emptyText={t("empty")}
        {...(withControls ? { pagination: view.pagination } : {})}
      />
    </div>
  );
}
