"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PriceListPricing, PriceListValidity } from "@/features/price-list/ui/price-list-terms";
import { priceListsRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type PriceListTableViewProps = GenerativeProps<"price-list-table">;

/** A page of price lists; names link to the price lists settings page. */
export function PriceListTableView({ items, nextCursor }: PriceListTableViewProps) {
  const t = useTranslations("assistant.ui.priceList");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="price-list-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.validity")}</TableHead>
            <TableHead>{t("columns.pricing")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((priceList) => (
            <TableRow key={priceList.id}>
              <TableCell className="font-medium">
                <Link href={priceListsRoute()} className="hover:underline">
                  {priceList.name}
                </Link>
              </TableCell>
              <TableCell>
                <PriceListValidity {...priceList} />
              </TableCell>
              <TableCell>
                <PriceListPricing {...priceList} itemCount={priceList.items.length} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
