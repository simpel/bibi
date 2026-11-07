"use client";

import type { PriceListDto } from "@bibi/core";
import { ContextMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import type { PriceListFormData } from "./load-price-list-form-data";
import { usePriceListColumns } from "./use-price-list-columns";
import { usePriceListQualifiers } from "./use-price-list-qualifiers";

export type PriceListTableProps = {
  priceLists: PriceListDto[];
  data: PriceListFormData;
  access: RowAccess;
};

const editRoute = ({ id }: { id: string }) =>
  updateRoute({ detail: listItemRoute({ list: ROUTES.adminPriceLists, id }) });

/** Price lists with their customer, validity and pricing; a row opens its update page. */
export function PriceListTable({ priceLists, data, access }: PriceListTableProps) {
  const t = useTranslations("priceList");
  const router = useRouter();
  const columns = usePriceListColumns({ data, access });
  const qualifiers = usePriceListQualifiers({ priceLists, data });
  const view = useClientTableView({
    rows: priceLists,
    qualifiers,
    getSearchText: (list) => list.name,
    totalLabel: (count) => `${count}`,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="price-list.list"
        columns={columns}
        data={view.rows}
        getRowId={(priceList) => priceList.id}
        onRowClick={access.canEdit ? (list) => router.push(editRoute({ id: list.id })) : undefined}
        rowMenu={
          access.canEdit
            ? (list) => (
                <ContextMenuItem asChild>
                  <Link href={editRoute({ id: list.id })}>
                    <PencilIcon />
                    {t("edit")}
                  </Link>
                </ContextMenuItem>
              )
            : undefined
        }
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
