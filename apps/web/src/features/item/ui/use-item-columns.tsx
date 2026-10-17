import type { EntityTypeDto, ItemDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import { itemRoute } from "@/lib/configuration-routes";
import { priceText } from "./price-text";

type Column = ColumnDef<ItemDto>;

export type UseItemColumnsInput = {
  types: EntityTypeDto[];
  venues: { id: string; name: string }[];
  locale: string;
};

/** Name · type · venue · price. */
export function useItemColumns({ types, venues, locale }: UseItemColumnsInput): Column[] {
  const t = useTranslations("item");
  return useMemo<Column[]>(
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
        id: "type",
        header: t("columns.type"),
        accessorFn: (item) => nameOf({ options: types, id: item.entityTypeId }),
      },
      {
        id: "venue",
        header: t("columns.venue"),
        accessorFn: (item) => nameOf({ options: venues, id: item.venueId }),
      },
      {
        id: "price",
        header: t("columns.price"),
        accessorFn: (item) => item.priceMinor ?? undefined,
        cell: ({ row }) => priceText({ item: row.original, locale, t }),
      },
    ],
    [t, types, venues, locale],
  );
}
