"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type ItemTableViewProps = GenerativeProps<"item-table">;

/** A page of items; each name links to the item page. */
export function ItemTableView({ items, nextCursor }: ItemTableViewProps) {
  const t = useTranslations("assistant.ui.item");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="item-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.price")}</TableHead>
            <TableHead>{t("columns.setups")}</TableHead>
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
              <TableCell>
                {item.priceMinor === null
                  ? "–"
                  : format.number(item.priceMinor / 100, { style: "currency", currency: "SEK" })}
              </TableCell>
              <TableCell>{item.setups.length > 0 ? item.setups.length : "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
