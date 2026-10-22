import type { EntityTypeDto, ItemDto } from "@bibi/core";
import type { ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import { itemRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import { priceText } from "./price-text";

type Column = ColumnDef<ItemDto>;

export type UseItemColumnsInput = {
  types: EntityTypeDto[];
  venues: { id: string; name: string }[];
  /** Venue cell text when the caller may not view venues (ADR 0050). */
  hidden?: string | undefined;
  locale: string;
};

/** Name · type · venue · price. */
export function useItemColumns({ types, venues, hidden, locale }: UseItemColumnsInput): Column[] {
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
        accessorFn: (item) => nameOf({ options: venues, id: item.venueId, hidden }),
      },
      {
        id: "price",
        header: t("columns.price"),
        accessorFn: (item) => item.priceMinor ?? undefined,
        cell: ({ row }) => priceText({ item: row.original, locale, t }),
      },
    ],
    [t, types, venues, hidden, locale],
  );
}
