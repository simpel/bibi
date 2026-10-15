"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { bookingRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { occupancyPeriod } from "./occupancy-period";

export type ProgramItemTableViewProps = GenerativeProps<"program-item-table">;

/** A page of program items; each name links to its booking's page. */
export function ProgramItemTableView({ items, nextCursor }: ProgramItemTableViewProps) {
  const t = useTranslations("assistant.ui.programItem");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="program-item-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.when")}</TableHead>
            <TableHead>{t("columns.quantity")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((programItem) => (
            <TableRow key={programItem.id}>
              <TableCell className="font-medium">
                <Link
                  href={bookingRoute({ id: programItem.bookingId })}
                  className="hover:underline"
                >
                  {programItem.name}
                </Link>
              </TableCell>
              <TableCell>{occupancyPeriod({ format, ...programItem })}</TableCell>
              <TableCell>{programItem.quantity ?? "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
