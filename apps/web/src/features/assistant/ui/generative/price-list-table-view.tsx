"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { PriceListPricing, PriceListValidity } from "@/features/price-list/ui/price-list-terms";
import { priceListsRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type PriceListTableViewProps = GenerativeProps<"price-list-table">;

type Row = PriceListTableViewProps["items"][number];

function usePriceListColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.priceList");
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (list) => list.name,
        cell: ({ row }) => (
          <Link href={priceListsRoute()} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
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
        accessorFn: (list) => list.discountPercent ?? list.items.length,
        cell: ({ row }) => (
          <PriceListPricing {...row.original} itemCount={row.original.items.length} />
        ),
      },
    ],
    [t],
  );
}

/** A page of price lists; names link to the price lists settings page. */
export function PriceListTableView({ items, nextCursor }: PriceListTableViewProps) {
  const t = useTranslations("assistant.ui.priceList");
  const columns = usePriceListColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="price-list-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.price-list"
        columns={columns}
        data={items}
        getRowId={(list) => list.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
