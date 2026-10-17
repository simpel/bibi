"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { bookingRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type SheetTableViewProps = GenerativeProps<"sheet-table">;

/** A page of sheet versions; each row links to its booking's page. */
export function SheetTableView({ items, nextCursor }: SheetTableViewProps) {
  const t = useTranslations("assistant.ui.sheet");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="sheet-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.version")}</TableHead>
            <TableHead>{t("columns.changes")}</TableHead>
            <TableHead>{t("columns.sent")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((sheet) => (
            <TableRow key={sheet.id}>
              <TableCell className="font-medium">
                <Link href={bookingRoute({ id: sheet.bookingId })} className="hover:underline">
                  {t("version", { version: sheet.version })}
                </Link>
              </TableCell>
              <TableCell>{sheet.changes.length > 0 ? `★ ${sheet.changes.length}` : "–"}</TableCell>
              <TableCell>
                {sheet.sentAt
                  ? format.dateTime(new Date(sheet.sentAt), { dateStyle: "medium" })
                  : t("notSent")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
