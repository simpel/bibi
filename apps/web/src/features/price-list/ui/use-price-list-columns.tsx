import type { PriceListDto } from "@okazi/core";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListRowActions } from "./price-list-row-actions";
import { PriceListPricing, PriceListValidity } from "./price-list-terms";

type Translator<N extends "priceList" | "priceList.pricing"> = ReturnType<
  typeof useTranslations<N>
>;
type Column = ColumnDef<PriceListDto>;

export type UsePriceListColumnsInput = { data: PriceListFormData; canWrite: boolean };

type DataInput = {
  data: PriceListFormData;
  t: Translator<"priceList">;
  pricing: Translator<"priceList.pricing">;
};

/** The data columns (without the row actions). */
function dataColumns({ data, t, pricing }: DataInput): Column[] {
  return [
    { id: "name", header: t("columns.name"), accessorFn: (list) => list.name },
    {
      id: "customer",
      header: t("columns.customer"),
      accessorFn: (list) =>
        list.customerId
          ? nameOf({ options: data.customers, id: list.customerId })
          : t("noCustomer"),
    },
    {
      id: "validity",
      header: t("columns.validity"),
      accessorFn: (list) => (list.validFrom ? new Date(list.validFrom) : undefined),
      cell: ({ row }) => <PriceListValidity {...row.original} />,
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
  ];
}

/** Name · customer · validity · pricing, plus the row actions when the caller can write. */
export function usePriceListColumns({ data, canWrite }: UsePriceListColumnsInput): Column[] {
  const t = useTranslations("priceList");
  const pricing = useTranslations("priceList.pricing");
  const common = useTranslations("common");
  return useMemo<Column[]>(() => {
    const columns = dataColumns({ data, t, pricing });
    if (!canWrite) return columns;
    return [
      ...columns,
      actionsColumn<PriceListDto>({
        label: common("actions"),
        cell: (priceList) => <PriceListRowActions priceList={priceList} data={data} />,
      }),
    ];
  }, [t, pricing, common, data, canWrite]);
}
