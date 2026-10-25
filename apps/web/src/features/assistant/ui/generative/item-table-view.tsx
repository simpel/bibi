"use client";

import { Card, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { itemRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type ItemTableViewProps = GenerativeProps<"item-table">;

type Row = ItemTableViewProps["items"][number];

function useItemColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.item");
  const { money } = useNumberFormat();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: t("columns.name"),
        accessorFn: (item) => item.name,
        cell: ({ row }) => (
          <Link href={itemRoute({ id: row.original.id })} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "setups",
        header: t("columns.setups"),
        accessorFn: (item) => item.setups.length,
        cell: ({ row }) => (row.original.setups.length > 0 ? row.original.setups.length : "–"),
      },
      {
        id: "price",
        header: t("columns.price"),
        accessorFn: (item) => item.priceMinor ?? undefined,
        cell: ({ row }) =>
          row.original.priceMinor === null ? "–" : money({ minor: row.original.priceMinor }),
      },
    ],
    [t, money],
  );
}

/** A page of items; each name links to the item page. */
export function ItemTableView({ items, nextCursor }: ItemTableViewProps) {
  const t = useTranslations("assistant.ui.item");
  const columns = useItemColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="item-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="assistant.item"
        columns={columns}
        data={items}
        getRowId={(item) => item.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
