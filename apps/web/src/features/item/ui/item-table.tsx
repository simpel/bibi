import type { EntityTypeDto, ItemDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { itemRoute } from "@/lib/configuration-routes";
import { formatKr } from "./format-price";
import type { ItemTranslator } from "./item-translator";

export type ItemTableProps = {
  items: ItemDto[];
  types: EntityTypeDto[];
  venues: { id: string; name: string }[];
  locale: string;
};

type NameOfInput = { list: { id: string; name: string }[]; id: string | null };

const nameOf = ({ list, id }: NameOfInput) => list.find((entry) => entry.id === id)?.name ?? "–";

type PriceTextInput = {
  item: ItemDto;
  locale: string;
  t: ItemTranslator;
};

function priceText({ item, locale, t }: PriceTextInput): string {
  if (item.priceMinor === null || item.priceUnit === null) return "–";
  const amount = formatKr({ minor: item.priceMinor, locale });
  return t("priceValue", { amount, unit: t(`priceUnits.${item.priceUnit}`) });
}

/** Item catalog rows: name (link to the detail page), type, venue and price. */
export async function ItemTable({ items, types, venues, locale }: ItemTableProps) {
  const t = await getTranslations("item");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.type")}</TableHead>
          <TableHead>{t("columns.venue")}</TableHead>
          <TableHead>{t("columns.price")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <Link href={itemRoute({ id: item.id })} className="hover:underline">
                {item.name}
              </Link>
            </TableCell>
            <TableCell>{nameOf({ list: types, id: item.entityTypeId })}</TableCell>
            <TableCell>{nameOf({ list: venues, id: item.venueId })}</TableCell>
            <TableCell>{priceText({ item, locale, t })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
