import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { VatRow } from "../lib/table-rows";

/** VAT rate, the amount invoiced at it (excluding VAT) and the output VAT. */
export function useVatColumns(): ColumnDef<VatRow>[] {
  const t = useTranslations("finance.vat.columns");
  return useMemo<ColumnDef<VatRow>[]>(
    () => [
      {
        id: "rate",
        header: t("rate"),
        accessorFn: (row) => row.rate,
        cell: ({ row }) => row.original.rateText,
      },
      {
        id: "base",
        header: t("base"),
        accessorFn: (row) => row.totalMinor,
        cell: ({ row }) => row.original.totalText,
      },
      {
        id: "vat",
        header: t("vat"),
        accessorFn: (row) => row.vatMinor,
        cell: ({ row }) => row.original.vatText,
      },
    ],
    [t],
  );
}
