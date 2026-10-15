"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { itemRoute } from "@/lib/configuration-routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { occupancyPeriod } from "./occupancy-period";

export type OccupancyTableViewProps = GenerativeProps<"occupancy-table">;

/** A page of occupancies; each type links to the item's page. */
export function OccupancyTableView({ items, nextCursor }: OccupancyTableViewProps) {
  const t = useTranslations("assistant.ui.occupancy");
  const types = useTranslations("occupancy.types");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="occupancy-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.type")}</TableHead>
            <TableHead>{t("columns.period")}</TableHead>
            <TableHead>{t("columns.note")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((occupancy) => (
            <TableRow key={occupancy.id}>
              <TableCell className="font-medium">
                <Link href={itemRoute({ id: occupancy.itemId })} className="hover:underline">
                  {types(occupancy.type)}
                </Link>
              </TableCell>
              <TableCell>{occupancyPeriod({ format, ...occupancy })}</TableCell>
              <TableCell>{occupancy.note ?? "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
