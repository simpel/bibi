"use client";

import type { PriceListDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { PriceListFormData } from "./load-price-list-form-data";
import { usePriceListColumns } from "./use-price-list-columns";

export type PriceListTableProps = {
  priceLists: PriceListDto[];
  data: PriceListFormData;
  canWrite: boolean;
};

/** Price lists with their customer, validity and pricing. */
export function PriceListTable({ priceLists, data, canWrite }: PriceListTableProps) {
  const t = useTranslations("priceList");
  const columns = usePriceListColumns({ data, canWrite });
  return (
    <PersistedDataTable
      tableId="price-list.list"
      columns={columns}
      data={priceLists}
      getRowId={(priceList) => priceList.id}
      emptyText={t("empty")}
    />
  );
}
