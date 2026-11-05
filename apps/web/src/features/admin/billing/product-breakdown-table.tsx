"use client";

import type { ProductBreakdown } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type ProductRow, useProductBreakdownColumns } from "./use-product-breakdown-columns";

export type ProductBreakdownTableProps = {
  products: ProductBreakdown;
  currency: string;
};

/** Product revenue distribution: monthly vs annual plans and extra seats with footer totals. */
export function ProductBreakdownTable({ products, currency }: ProductBreakdownTableProps) {
  const t = useTranslations("admin.billing.productsBreakdown");
  const columns = useProductBreakdownColumns({ products, currency });

  const data: ProductRow[] = [
    {
      key: "baseMonthly",
      name: t("names.baseMonthly"),
      count: products.monthly.count,
      unitPriceMinor: products.monthly.unitPriceMinor,
      monthlyRevenueMinor: products.monthly.monthlyRevenueMinor,
      annualRevenueMinor: null,
      currency,
    },
    {
      key: "baseYearly",
      name: t("names.baseYearly"),
      count: products.yearly.count,
      unitPriceMinor: products.yearly.unitPriceMinor,
      monthlyRevenueMinor: products.yearly.monthlyRevenueMinor,
      annualRevenueMinor: products.yearly.annualRevenueMinor ?? null,
      currency,
    },
    {
      key: "seatMonthly",
      name: t("names.seatMonthly"),
      count: products.extraSeats.count,
      unitPriceMinor: products.extraSeats.unitPriceMinor,
      monthlyRevenueMinor: products.extraSeats.monthlyRevenueMinor,
      annualRevenueMinor: null,
      currency,
    },
  ];

  return (
    <PersistedDataTable
      tableId="admin.billing-products"
      columns={columns}
      data={data}
      getRowId={(row) => row.key}
      emptyText={t("empty")}
    />
  );
}
