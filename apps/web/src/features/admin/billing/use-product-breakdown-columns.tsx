"use client";

import type { ProductBreakdown } from "@bibi/core/schemas";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";

export type ProductRow = {
  key: "baseMonthly" | "baseYearly" | "seatMonthly";
  name: string;
  count: number;
  unitPriceMinor: number;
  monthlyRevenueMinor: number;
  annualRevenueMinor: number | null;
  currency: string;
};

export type UseProductBreakdownColumnsInput = {
  products: ProductBreakdown;
  currency: string;
};

type Column = ColumnDef<ProductRow>;

/** Columns for the product breakdown table, with totals in the footer. */
export function useProductBreakdownColumns({
  products,
  currency,
}: UseProductBreakdownColumnsInput): Column[] {
  const t = useTranslations("admin.billing.productsBreakdown");
  const numbers = useNumberFormat();

  const totalMonthlyMinor =
    products.monthly.monthlyRevenueMinor +
    products.yearly.monthlyRevenueMinor +
    products.extraSeats.monthlyRevenueMinor;

  return [
    {
      id: "product",
      header: t("columns.product"),
      accessorFn: (row) => row.name,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      footer: () => <span className="font-semibold">{t("total")}</span>,
    },
    {
      id: "active",
      header: t("columns.active"),
      accessorFn: (row) => row.count,
      cell: ({ row }) =>
        row.original.key === "seatMonthly"
          ? t("seatCount", { count: row.original.count })
          : t("orgCount", { count: row.original.count }),
      footer: () => (
        <span className="font-medium text-muted-foreground tabular-nums">
          {t("orgCount", { count: products.monthly.count + products.yearly.count })}
        </span>
      ),
    },
    {
      id: "unitPrice",
      header: t("columns.unitPrice"),
      accessorFn: (row) => row.unitPriceMinor,
      cell: ({ row }) => {
        const price = numbers.money({
          minor: row.original.unitPriceMinor,
          currency: row.original.currency,
        });
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.original.key === "baseYearly" ? t("perYear", { price }) : t("perMonth", { price })}
          </span>
        );
      },
    },
    {
      id: "monthlyRevenue",
      header: t("columns.monthlyRevenue"),
      accessorFn: (row) => row.monthlyRevenueMinor,
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {numbers.money({
            minor: row.original.monthlyRevenueMinor,
            currency: row.original.currency,
          })}
        </span>
      ),
      footer: () => (
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {numbers.money({ minor: totalMonthlyMinor, currency })}
        </span>
      ),
    },
    {
      id: "annualRevenue",
      header: t("columns.annualRevenue"),
      accessorFn: (row) => row.annualRevenueMinor ?? -1,
      cell: ({ row }) =>
        row.original.annualRevenueMinor ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {numbers.money({
              minor: row.original.annualRevenueMinor,
              currency: row.original.currency,
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      footer: () =>
        products.yearly.annualRevenueMinor ? (
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {numbers.money({ minor: products.yearly.annualRevenueMinor, currency })}
          </span>
        ) : null,
    },
  ];
}
