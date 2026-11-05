import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { nameOf } from "@/components/form/named-option";
import { itemRoute } from "@/lib/configuration-routes";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { priceText } from "./price-text";

type Column = ColumnDef<ItemDto>;

export type UseItemColumnsInput = {
  types: EntityTypeDto[];
  venues: { id: string; name: string }[];
  /** Venue cell text when the caller may not view venues (ADR 0050). */
  hidden?: string | undefined;
  renderActions?: ((row: ItemDto) => ReactNode) | undefined;
};

/** Name · type · venue · price · sticky actions. */
export function useItemColumns({
  types,
  venues,
  hidden,
  renderActions,
}: UseItemColumnsInput): Column[] {
  const t = useTranslations("item");
  const common = useTranslations("common");
  const { money } = useNumberFormat();
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
        cell: ({ row }) => priceText({ item: row.original, money, t }),
      },
      ...(renderActions
        ? [actionsColumn<ItemDto>({ label: common("actions"), cell: renderActions })]
        : []),
    ],
    [t, common, types, venues, hidden, money, renderActions],
  );
}
