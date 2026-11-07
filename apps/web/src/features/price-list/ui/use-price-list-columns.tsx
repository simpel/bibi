import type { PriceListDto } from "@bibi/core";
import { actionsColumn, type ColumnDef, createTableColumns, dateColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { RowAccess } from "@/lib/can";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListRowActions } from "./price-list-row-actions";
import { PriceListPricing, PriceListValidity } from "./price-list-terms";
import { priceListCustomerName } from "./use-price-list-qualifiers";

type Column = ColumnDef<PriceListDto>;

export type UsePriceListColumnsInput = { data: PriceListFormData; access: RowAccess };

/** Name · customer · validity · pricing, plus the row actions when the caller can write. */
export function usePriceListColumns({ data, access }: UsePriceListColumnsInput): Column[] {
  const t = useTranslations("priceList");
  const pricing = useTranslations("priceList.pricing");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const none = t("noCustomer");
    const hidden = common("hidden");
    return createTableColumns<PriceListDto>({
      primary: [{ id: "name", header: t("columns.name"), accessorFn: (list) => list.name }],
      relations: [
        {
          id: "customer",
          header: t("columns.customer"),
          accessorFn: (list) => priceListCustomerName({ list, data, none, hidden }),
        },
        {
          id: "pricing",
          header: t("columns.pricing"),
          accessorFn: (list) =>
            list.discountPercent === null
              ? pricing("items", { count: list.items.length })
              : pricing("discount", { percent: list.discountPercent }),
          cell: ({ row }) => (
            <PriceListPricing {...row.original} itemCount={row.original.items.length} />
          ),
        },
      ],
      dates: [
        dateColumn<PriceListDto>({
          id: "validity",
          header: t("columns.validity"),
          getSortValue: (list) => (list.validFrom ? new Date(list.validFrom).getTime() : 0),
          cell: (list) => <PriceListValidity {...list} />,
        }),
      ],
      actions:
        access.canEdit || access.canRemove
          ? [
              actionsColumn<PriceListDto>({
                label: common("actions"),
                cell: (priceList) => (
                  <PriceListRowActions priceList={priceList} data={data} access={access} />
                ),
              }),
            ]
          : [],
    });
  }, [t, pricing, common, data, access]);
}
